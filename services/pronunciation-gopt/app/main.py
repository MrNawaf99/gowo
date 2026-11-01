"""GOPT pronunciation assessment service (internal).

Endpoints
  GET  /health      liveness: the process is running
  GET  /ready       readiness: model, lexicon and Kaldi pipeline loaded AND a
                    real self-test assessment succeeded
  POST /v1/assess   multipart: audio (16 kHz mono PCM16 WAV), reference_text

Privacy: recordings exist only in memory and a per-request temp directory
that is deleted before the response is sent. Audio and reference text are
never logged.
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .assessor import Assessor, safe_reference_text
from .audio import MAX_BYTES, load_recording
from .errors import ServiceError

log = logging.getLogger("gopt-service")
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")


class State:
    assessor: Optional[Assessor] = None
    ready = False
    not_ready_reason = "starting"
    startup_ms: Optional[int] = None
    selftest_ms: Optional[int] = None
    semaphore: Optional[asyncio.Semaphore] = None
    queue_timeout_s = 10.0
    token: Optional[str] = None


state = State()


def build_assessor() -> Assessor:
    """Imported lazily so unit tests can run without Kaldi or model files."""
    from .gopt_model import GoptModel
    from .kaldi import KaldiGopExtractor
    from .lexicon import Lexicon, make_g2p

    model_dir = Path(os.environ.get("MODEL_DIR", "/models"))
    use_g2p = os.environ.get("ENABLE_G2P", "1") == "1"
    lexicon = Lexicon.load(model_dir / "librispeech-lexicon.txt", make_g2p() if use_g2p else None)
    model = GoptModel(
        model_dir / "gopt_librispeech" / "best_audio_model.pth",
        Path(__file__).with_name("phone_ids.json"),
        threads=int(os.environ.get("TORCH_THREADS", "1")),
    )
    extractor = KaldiGopExtractor(model_dir=model_dir, lang_dir=model_dir / "lang_nosp")
    return Assessor(lexicon=lexicon, extractor=extractor, model=model, engine_version=os.environ.get("ENGINE_VERSION", "dev"))


def run_selftest(assessor: Assessor) -> int:
    wav_path = Path(os.environ.get("SELFTEST_WAV", "/app/selftest/selftest.wav"))
    text = os.environ.get("SELFTEST_TEXT", "")
    if not text:
        raise RuntimeError("SELFTEST_TEXT is not set")
    started = time.perf_counter()
    result = assessor.assess(text, load_recording(wav_path.read_bytes()))
    if not result["words"] or not result["words"][0]["phones"]:
        raise RuntimeError("Self-test produced no phone scores")
    return round((time.perf_counter() - started) * 1000)


async def initialise(app: FastAPI) -> None:
    started = time.perf_counter()
    try:
        assessor = await run_in_threadpool(build_assessor)
        state.selftest_ms = await run_in_threadpool(run_selftest, assessor)
        state.assessor = assessor
        state.ready = True
        state.not_ready_reason = ""
        log.info("ready: startup %d ms, self-test %d ms", round((time.perf_counter() - started) * 1000), state.selftest_ms)
    except Exception as exc:  # stay alive so /health and /ready can report the failure
        state.ready = False
        state.not_ready_reason = f"startup failed: {type(exc).__name__}: {exc}"
        log.exception("startup failed")
    finally:
        state.startup_ms = round((time.perf_counter() - started) * 1000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    state.semaphore = asyncio.Semaphore(int(os.environ.get("MAX_CONCURRENT", "2")))
    state.queue_timeout_s = float(os.environ.get("QUEUE_TIMEOUT_S", "10"))
    state.token = os.environ.get("SERVICE_TOKEN") or None
    if os.environ.get("SKIP_INIT") != "1":
        asyncio.get_running_loop().create_task(initialise(app))
    yield


app = FastAPI(title="GoWord GOPT pronunciation service", version="1", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.exception_handler(ServiceError)
async def service_error_handler(_request: Request, exc: ServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status, content=exc.to_body())


@app.exception_handler(Exception)
async def unexpected_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    log.exception("unhandled error")
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL", "message": "Internal error"}})


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/ready")
async def ready() -> JSONResponse:
    if not state.ready:
        return JSONResponse(status_code=503, content={"ready": False, "reason": state.not_ready_reason, "startup_ms": state.startup_ms})
    return JSONResponse(content={"ready": True, "startup_ms": state.startup_ms, "selftest_ms": state.selftest_ms})


def check_auth(request: Request) -> None:
    if state.token is None:
        return
    header = request.headers.get("authorization", "")
    supplied = header[7:] if header.lower().startswith("bearer ") else ""
    if not hmac.compare_digest(supplied, state.token):
        raise ServiceError("UNAUTHORIZED", "Invalid service token", 401)


@app.post("/v1/assess")
async def assess(request: Request, audio: UploadFile = File(...), reference_text: str = Form(...)) -> JSONResponse:
    check_auth(request)
    if not state.ready or state.assessor is None:
        raise ServiceError("NOT_READY", "Model is not loaded yet", 503)

    text = safe_reference_text(reference_text)
    data = await audio.read(MAX_BYTES + 1)
    recording = load_recording(data)  # validates format and rejects silence before any heavy work
    del data

    assert state.semaphore is not None
    try:
        await asyncio.wait_for(state.semaphore.acquire(), timeout=state.queue_timeout_s)
    except asyncio.TimeoutError as exc:
        raise ServiceError("BUSY", "Service is at capacity, try again", 429) from exc
    try:
        result = await run_in_threadpool(state.assessor.assess, text, recording)
    finally:
        state.semaphore.release()

    log.info("assessed words=%d audio_ms=%d processing_ms=%d", len(result["words"]), result["duration_ms"], result["processing_ms"])
    return JSONResponse(content=result)
