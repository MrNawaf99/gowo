"""Unit tests that run without Kaldi or model downloads.

    pip install -r requirements.txt pytest httpx torch
    pytest tests
"""

from __future__ import annotations

import asyncio
import io
import json
import wave
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "speechocean762"


def make_wav(seconds=1.0, rate=16000, channels=1, width=2, amplitude=0.5, freq=220.0) -> bytes:
    n = int(seconds * rate)
    t = np.arange(n) / rate
    samples = (amplitude * np.sin(2 * np.pi * freq * t) * 32767).astype("<i2")
    if channels == 2:
        samples = np.repeat(samples, 2)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(width)
        w.setframerate(rate)
        w.writeframes(samples.tobytes() if width == 2 else (samples // 256).astype("i1").tobytes())
    return buf.getvalue()


# ---------------------------------------------------------------- audio
from app.audio import load_recording  # noqa: E402
from app.errors import ServiceError  # noqa: E402


def code_of(fn, *args):
    with pytest.raises(ServiceError) as info:
        fn(*args)
    return info.value.code, info.value.status


def test_accepts_phase3_format_and_real_fixture():
    rec = load_recording(make_wav(1.2))
    assert abs(rec.duration_s - 1.2) < 1e-6
    real = load_recording((FIXTURES / "three_correct.wav").read_bytes())
    assert 2.0 < real.duration_s < 2.5


@pytest.mark.parametrize(
    "data,expected",
    [
        (b"", ("INVALID_AUDIO", 400)),
        (b"ID3" + b"\0" * 100, ("INVALID_AUDIO", 415)),
        (make_wav(rate=44100), ("INVALID_AUDIO", 415)),
        (make_wav(channels=2), ("INVALID_AUDIO", 415)),
        (make_wav(0.1), ("NO_SPEECH", 422)),
        (make_wav(1.0, amplitude=0.0), ("NO_SPEECH", 422)),
        (make_wav(10.9), ("INVALID_AUDIO", 413)),
    ],
    ids=["empty", "not-wav", "44khz", "stereo", "too-short", "silent", "too-long"],
)
def test_rejects_bad_or_empty_audio(data, expected):
    assert code_of(load_recording, data) == expected


def test_rejects_oversized_upload_before_parsing():
    assert code_of(load_recording, b"RIFF" + b"\0" * 1_100_000) == ("INVALID_AUDIO", 413)


# ---------------------------------------------------------------- lexicon
from app.lexicon import Lexicon, phone_stress  # noqa: E402

LEX = Lexicon(
    {
        "THREE": ("TH", "R", "IY1"),
        "RABBIT": ("R", "AE1", "B", "AH0", "T"),
        "WELL": ("W", "EH1", "L"),
        "KNOWN": ("N", "OW1", "N"),
        "DON'T": ("D", "OW1", "N", "T"),
        "A": ("AH0",),
    }
)


def test_pronounce_marks_kaldi_positions():
    [[three]] = LEX.pronounce("three")
    assert three.kaldi_phones() == ["TH_B", "R_I", "IY1_E"]
    assert three.pure_phones == ["TH", "R", "IY"]
    [[a]] = LEX.pronounce("a")
    assert a.kaldi_phones() == ["AH0_S"]


def test_stress_is_reported_beside_the_pure_phone():
    # In CMUdict the digit on AH carries the vowel quality (AH1/AH2 = /ʌ/ "cut",
    # AH0 = /ə/ "about"), and the pure phone the model scores cannot express it.
    [[rabbit]] = LEX.pronounce("rabbit")
    assert rabbit.pure_phones == ["R", "AE", "B", "AH", "T"]
    assert rabbit.stresses == [None, 1, None, 0, None]
    assert [phone_stress(p) for p in ("AH0", "AH1", "AH2", "TH", "")] == [0, 1, 2, None, None]


def test_words_line_up_with_goword_tokenisation():
    groups = LEX.pronounce("Well-known, don't rabbit!")
    assert [g[0].text for g in groups] == ["Well-known", "don't", "rabbit"]
    assert [p.lexicon_word for p in groups[0]] == ["WELL", "KNOWN"]


def test_oov_without_g2p_is_unsupported_and_g2p_fallback_is_used_when_available():
    assert code_of(LEX.pronounce, "zyxwv") == ("UNSUPPORTED_TEXT", 422)
    with_g2p = Lexicon({"THREE": ("TH", "R", "IY1")}, g2p=lambda w: ["Z", "IH1", "K", " ", "S"])
    [[word]] = with_g2p.pronounce("zyks")
    assert word.phones == ("Z", "IH1", "K", "S") and word.source == "g2p"
    assert code_of(LEX.pronounce, "  ") == ("UNSUPPORTED_TEXT", 422)
    assert code_of(LEX.pronounce, "24 !!") == ("UNSUPPORTED_TEXT", 422)


# ---------------------------------------------------------------- kaldi output parsing
from app.kaldi import parse_feat_text  # noqa: E402


def test_parse_compute_gop_text_output_sorts_by_phone_index():
    row = lambda i, pid: f"utt.{i} [ {pid} " + " ".join(["0.5"] * 84) + " ]"
    rows = parse_feat_text("\n".join([row(1, 30), row(0, 34), row(2, 20)]) + "\n")
    assert [(i, pid) for i, pid, _ in rows] == [(0, 34), (1, 30), (2, 20)]
    assert rows[0][2].shape == (84,)
    with pytest.raises(ValueError):
        parse_feat_text("utt.0 [ 1 2 3 ]")


# ---------------------------------------------------------------- assessor
from app.assessor import AlignmentError, Assessor  # noqa: E402
from app.gopt_model import GoptModel, GoptScores, to_percent  # noqa: E402


class FakeModel:
    def __init__(self, phone_scores):
        self.phone_scores = phone_scores
        self.calls = []

    def score(self, features, phones):
        self.calls.append(list(phones))
        n = len(phones)
        return GoptScores(phone=self.phone_scores[:n], word_accuracy_per_phone=[80.0] * n, utterance_accuracy=75.0)


class FakeExtractor:
    def __init__(self, rows=None, error=None):
        self.rows, self.error, self.seen = rows, error, []

    def extract(self, recording, words):
        self.seen.append([w.lexicon_word for w in words])
        if self.error:
            raise self.error
        n = self.rows if self.rows is not None else sum(len(w.phones) for w in words)
        return np.zeros((n, 84), dtype=np.float32)


def test_assessor_returns_v1_contract_for_exact_reference():
    model = FakeModel([20.0, 90.0, 95.0])
    extractor = FakeExtractor()
    result = Assessor(LEX, extractor, model, "test").assess("three", load_recording(make_wav()))
    assert extractor.seen == [["THREE"]] and model.calls == [["TH", "R", "IY"]]
    assert result["reference_text"] == "three"
    assert result["words"] == [
        {
            "text": "three",
            "accuracy": 80.0,
            "phones": [
                {"phone": "TH", "stress": None, "accuracy": 20.0},
                {"phone": "R", "stress": None, "accuracy": 90.0},
                {"phone": "IY", "stress": 1, "accuracy": 95.0},
            ],
            "pronunciation_source": "lexicon",
        }
    ]
    assert result["engine"]["name"] == "gopt-librispeech"


def test_stress_reaches_the_response_without_reaching_the_model():
    # The model is still given pure phones only: stress selects the teaching
    # target on the GoWord side, it must not change what is scored.
    model = FakeModel([90.0, 40.0, 95.0, 30.0, 88.0])
    result = Assessor(LEX, FakeExtractor(), model, "test").assess("rabbit", load_recording(make_wav()))
    assert model.calls == [["R", "AE", "B", "AH", "T"]]
    assert [p["stress"] for p in result["words"][0]["phones"]] == [None, 1, None, 0, None]


def test_each_request_is_independent():
    extractor = FakeExtractor()
    model = FakeModel([50.0] * 10)
    assessor = Assessor(LEX, extractor, model, "test")
    assessor.assess("three", load_recording(make_wav()))
    second = assessor.assess("rabbit", load_recording(make_wav()))
    assert extractor.seen == [["THREE"], ["RABBIT"]]
    assert model.calls[1] == ["R", "AE", "B", "AH", "T"]
    assert "TH" not in json.dumps(second)


def test_alignment_problems_are_no_speech_not_scores():
    rec = load_recording(make_wav())
    assessor = Assessor(LEX, FakeExtractor(error=AlignmentError("beam")), FakeModel([90.0] * 3), "t")
    assert code_of(assessor.assess, "three", rec) == ("NO_SPEECH", 422)
    assessor = Assessor(LEX, FakeExtractor(rows=2), FakeModel([90.0] * 3), "t")
    assert code_of(assessor.assess, "three", rec) == ("NO_SPEECH", 422)


def test_gopt_model_input_encoding_matches_training():
    torch = pytest.importorskip("torch")
    weights = ROOT.parents[1] / ".qa-tmp" / "models" / "gopt_best_audio_model.pth"
    if not weights.exists():
        pytest.skip("GOPT weights not downloaded")
    model = GoptModel(weights, ROOT / "app" / "phone_ids.json")
    scores = model.score(np.random.default_rng(0).normal(3.2, 4.0, (3, 84)).astype(np.float32), ["TH", "R", "IY"])
    assert len(scores.phone) == 3 and all(0 <= s <= 100 for s in scores.phone)
    assert to_percent(2.0) == 100.0 and to_percent(-0.3) == 0.0 and to_percent(1.0) == 50.0
    with pytest.raises(ValueError):
        model.score(np.zeros((2, 84), dtype=np.float32), ["TH", "R", "IY"])
    with pytest.raises(ValueError):
        model.score(np.zeros((1, 84), dtype=np.float32), ["XX"])


def test_phone_id_table_is_complete():
    ids = json.loads((ROOT / "app" / "phone_ids.json").read_text())
    assert len(ids) == 39 and sorted(ids.values()) == list(range(39))
    assert ids["W"] == 0 and ids["TH"] == 12 and ids["ZH"] == 38


# ---------------------------------------------------------------- API
@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("SKIP_INIT", "1")
    monkeypatch.setenv("SERVICE_TOKEN", "s3cret")
    from fastapi.testclient import TestClient

    from app import main

    with TestClient(main.app, raise_server_exceptions=False) as c:
        main.state.ready = False
        main.state.assessor = None
        main.state.not_ready_reason = "starting"
        yield c, main


def post(c, token="s3cret", text="three", audio=None):
    return c.post(
        "/v1/assess",
        headers={"Authorization": f"Bearer {token}"} if token else {},
        data={"reference_text": text},
        files={"audio": ("clip.wav", audio if audio is not None else make_wav(), "audio/wav")},
    )


def test_health_is_liveness_but_ready_requires_loaded_model(client):
    c, main = client
    assert c.get("/health").json() == {"status": "ok"}
    r = c.get("/ready")
    assert r.status_code == 503 and r.json()["ready"] is False
    assert post(c).json()["error"]["code"] == "NOT_READY"

    main.state.assessor = Assessor(LEX, FakeExtractor(), FakeModel([90.0] * 5), "t")
    main.state.ready = True
    assert c.get("/ready").status_code == 200


def test_auth_validation_and_success(client):
    c, main = client
    main.state.assessor = Assessor(LEX, FakeExtractor(), FakeModel([90.0] * 5), "t")
    main.state.ready = True
    assert post(c, token="wrong").status_code == 401
    assert post(c, token=None).json()["error"]["code"] == "UNAUTHORIZED"
    assert post(c, audio=make_wav(rate=8000)).json()["error"]["code"] == "INVALID_AUDIO"
    assert post(c, audio=make_wav(1.0, amplitude=0.0)).json()["error"]["code"] == "NO_SPEECH"
    assert post(c, text="line1\nline2").json()["error"]["code"] == "UNSUPPORTED_TEXT"
    ok = post(c)
    assert ok.status_code == 200 and ok.json()["reference_text"] == "three"
    assert "processing_ms" in ok.json()


def test_busy_when_capacity_is_exhausted(client):
    c, main = client
    main.state.assessor = Assessor(LEX, FakeExtractor(), FakeModel([90.0] * 5), "t")
    main.state.ready = True
    main.state.queue_timeout_s = 0.05
    main.state.semaphore = asyncio.Semaphore(0)
    r = post(c)
    assert r.status_code == 429 and r.json()["error"]["code"] == "BUSY"


def test_unexpected_errors_do_not_leak_details(client):
    c, main = client

    class Boom:
        def assess(self, *_):
            raise RuntimeError("secret /models path")

    main.state.assessor = Boom()
    main.state.ready = True
    r = post(c)
    assert r.status_code == 500 and r.json() == {"error": {"code": "INTERNAL", "message": "Internal error"}}
