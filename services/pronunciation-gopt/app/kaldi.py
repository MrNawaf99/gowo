"""Kaldi GOP feature extraction (runs kaldi/assess_one.sh per recording).

Kaldi's command-line tools load the acoustic model per invocation; GOPT itself
stays resident in memory. Each request uses its own temporary directory, which
is removed (with the recording) before the response is returned.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np

from .assessor import AlignmentError
from .audio import Recording
from .lexicon import WordPron

SCRIPT = Path(__file__).resolve().parents[1] / "kaldi" / "assess_one.sh"
FEAT_DIM = 84
_VECTOR = re.compile(r"^(\S+)\s+\[\s*([^\]]*)\]\s*$")


def parse_feat_text(text: str) -> list[tuple[int, int, np.ndarray]]:
    """Parses compute-gop text output: 'utt.N [ phone_id f1 .. f84 ]' -> (N, phone_id, features)."""
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        m = _VECTOR.match(line)
        if not m:
            raise ValueError(f"Unexpected compute-gop line: {line[:80]}")
        key, values = m.group(1), np.array(m.group(2).split(), dtype=np.float32)
        if values.size != 1 + FEAT_DIM:
            raise ValueError(f"Expected {1 + FEAT_DIM} values per phone, got {values.size}")
        rows.append((int(key.rsplit(".", 1)[1]), int(values[0]), values[1:]))
    rows.sort(key=lambda r: r[0])
    return rows


def load_pure_phone_ids(path: Path) -> dict[str, int]:
    ids = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            sym, idx = line.split()
            ids[sym] = int(idx)
    return ids


class KaldiGopExtractor:
    def __init__(self, model_dir: Path, lang_dir: Path, timeout_s: float = 30.0):
        self.model_dir = model_dir
        self.lang_dir = lang_dir
        self.timeout_s = timeout_s
        self.pure_ids = load_pure_phone_ids(lang_dir / "phones-pure.txt")
        for required in (model_dir / "chain" / "final.mdl", lang_dir / "words.txt", model_dir / "conf" / "ivector_extractor.conf", SCRIPT):
            if not required.exists():
                raise RuntimeError(f"Missing {required}")
        if shutil.which("compute-gop") is None:
            raise RuntimeError("Kaldi binaries are not on PATH")

    def extract(self, recording: Recording, words: list[WordPron]) -> np.ndarray:
        with tempfile.TemporaryDirectory(prefix="gop-") as tmp:
            work = Path(tmp)
            (work / "clip.wav").write_bytes(recording.wav_bytes)
            (work / "text").write_text("utt " + " ".join(w.lexicon_word for w in words) + "\n", encoding="utf-8")
            (work / "text-phone").write_text(
                "".join(f"utt.{i} {' '.join(w.kaldi_phones())}\n" for i, w in enumerate(words)), encoding="utf-8"
            )
            env = dict(os.environ)
            try:
                proc = subprocess.run(
                    ["bash", str(SCRIPT), str(work), str(self.model_dir)],
                    cwd=str(work),
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_s,
                )
            except subprocess.TimeoutExpired as exc:
                raise RuntimeError(f"Kaldi pipeline exceeded {self.timeout_s}s") from exc

            if proc.returncode in (3, 4):
                raise AlignmentError(proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else "alignment failed")
            if proc.returncode != 0:
                log_tail = (work / "kaldi.log").read_text(encoding="utf-8", errors="replace")[-2000:] if (work / "kaldi.log").exists() else ""
                raise RuntimeError(f"Kaldi pipeline failed ({proc.returncode}): {proc.stderr[-500:]} {log_tail}")

            rows = parse_feat_text((work / "feat.txt").read_text(encoding="utf-8"))
        # Temporary directory (including clip.wav) is gone at this point.

        expected = [self.pure_ids[p] for w in words for p in w.pure_phones]
        got = [phone_id for _, phone_id, _ in rows]
        if got != expected:
            # The aligner matched a different phone sequence than the reference: not assessable.
            raise AlignmentError(f"aligned {len(got)} phones, expected {len(expected)} in reference order")
        return np.stack([features for _, _, features in rows]) if rows else np.zeros((0, FEAT_DIM), dtype=np.float32)
