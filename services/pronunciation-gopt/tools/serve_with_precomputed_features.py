"""Development integration server that runs WITHOUT Kaldi.

Serves the real FastAPI app, real lexicon and real GOPT model, but replaces the
Kaldi GOP extraction step with the GOPT authors' published Kaldi features for
the speechocean762 fixture recordings (looked up by the WAV's SHA-256).

This proves GoWord -> HTTP -> service -> GOPT -> normalised result on real
speech with real model scores. It does NOT prove our Kaldi pipeline; that is
verified separately in Docker by comparing its features with these.

    python tools/serve_with_precomputed_features.py \
        --features <fixture_official_features.json> --lexicon <librispeech-lexicon.txt> \
        --weights <best_audio_model.pth> --port 8200
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

import numpy as np
import uvicorn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", type=Path, required=True)
    ap.add_argument("--lexicon", type=Path, required=True)
    ap.add_argument("--weights", type=Path, required=True)
    ap.add_argument("--port", type=int, default=8200)
    args = ap.parse_args()

    os.environ["SKIP_INIT"] = "1"
    from app import main as service
    from app.assessor import AlignmentError, Assessor
    from app.gopt_model import GoptModel
    from app.lexicon import Lexicon

    manifest = json.loads((ROOT / "fixtures" / "speechocean762" / "manifest.json").read_text())
    official = json.loads(args.features.read_text())
    base_lexicon = Lexicon.load(args.lexicon)
    by_hash = {}
    for item in manifest:
        wav = (ROOT / "fixtures" / "speechocean762" / item["file"]).read_bytes()
        rows = np.array(official[item["speechocean762_utt"]], dtype=np.float32)
        # The published features follow each utterance's ANNOTATED phones, which can
        # differ from any dictionary (e.g. FOUR = "F AO" in one fixture, "F AO R" in
        # another), so each fixture carries its own pronunciations.
        entries = {w["text"]: tuple(w["phones"]) for w in item["human"]["words"]}
        by_hash[hashlib.sha256(wav).hexdigest()] = (rows[:, 1:], Lexicon(entries))

    class PrecomputedExtractor:
        def extract(self, recording, words):
            hit = by_hash.get(hashlib.sha256(recording.wav_bytes).hexdigest())
            if hit is None:
                raise AlignmentError("no precomputed features for this recording (dev server serves fixtures only)")
            return hit[0]

    class FixtureAssessor(Assessor):
        def assess(self, reference_text, recording):
            hit = by_hash.get(hashlib.sha256(recording.wav_bytes).hexdigest())
            self.lexicon = hit[1] if hit else base_lexicon
            return super().assess(reference_text, recording)

    assessor = FixtureAssessor(
        lexicon=base_lexicon,
        extractor=PrecomputedExtractor(),
        model=GoptModel(args.weights, ROOT / "app" / "phone_ids.json"),
        engine_version="dev-precomputed-kaldi-features",
    )

    # The app's lifespan leaves readiness alone when SKIP_INIT=1, so set it up front.
    service.state.assessor = assessor
    service.state.ready = True
    service.state.not_ready_reason = ""
    service.state.startup_ms = 0
    service.state.selftest_ms = 0

    uvicorn.run(service.app, host="127.0.0.1", port=args.port, log_level="info")


if __name__ == "__main__":
    main()
