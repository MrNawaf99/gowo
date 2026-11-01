"""The GOPT transformer, loaded once and kept in memory.

Model: YuanGongND/gopt, "GOPT (Librispeech)" weights (BSD-3-Clause), trained on
speechocean762 (CC BY 4.0) with GOP features from the Kaldi LibriSpeech model.
Inference must reproduce the training input exactly:
  * features normalised with the LibriSpeech-feature mean/std from traintest.py,
  * canonical phone ids from the same phone dictionary used in training,
  * sequences padded to 50 tokens with phone id -1 and zero features.
Model outputs are on speechocean762's 0-2 scale; they are reported as 0-100.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch

from .gopt import GOPT  # vendored unchanged from YuanGongND/gopt src/models/gopt.py

SEQ_LEN = 50
FEAT_DIM = 84
NORM_MEAN = 3.203  # traintest.py, am == 'librispeech'
NORM_STD = 4.045


@dataclass(frozen=True)
class GoptScores:
    phone: list[float]  # 0-100 per canonical phone, in order
    word_accuracy_per_phone: list[float]  # 0-100 word-accuracy head, emitted at phone positions
    utterance_accuracy: float  # 0-100


def to_percent(value: float) -> float:
    return float(max(0.0, min(100.0, value * 50.0)))


class GoptModel:
    def __init__(self, weights_path: Path, phone_ids_path: Path, threads: int = 1):
        self.phone_ids: dict[str, int] = json.loads(phone_ids_path.read_text(encoding="utf-8"))
        if len(self.phone_ids) != 39 or sorted(self.phone_ids.values()) != list(range(39)):
            raise RuntimeError(f"{phone_ids_path} must map the 39 pure ARPAbet phones to ids 0..38")

        torch.set_num_threads(max(1, threads))
        net = torch.nn.DataParallel(GOPT(embed_dim=24, num_heads=1, depth=3, input_dim=FEAT_DIM))
        state = torch.load(weights_path, map_location="cpu", weights_only=True)
        net.load_state_dict(state, strict=True)
        self._net = net.module.float().eval()
        # Serialise forward passes: the model is tiny (~2 ms), so contention is
        # cheaper than per-thread copies.
        self._lock = threading.Lock()

    def score(self, features: np.ndarray, phones: list[str]) -> GoptScores:
        """features: [n_phones, 84] GOP features; phones: pure ARPAbet symbols, same length."""
        if features.ndim != 2 or features.shape[1] != FEAT_DIM:
            raise ValueError(f"Expected [n, {FEAT_DIM}] features, got {features.shape}")
        n = features.shape[0]
        if n != len(phones):
            raise ValueError(f"{n} feature rows for {len(phones)} phones")
        if n == 0 or n > SEQ_LEN:
            raise ValueError(f"Phone count {n} outside 1..{SEQ_LEN}")

        x = np.zeros((1, SEQ_LEN, FEAT_DIM), dtype=np.float32)
        x[0, :n] = (features - NORM_MEAN) / NORM_STD
        ids = -np.ones((1, SEQ_LEN), dtype=np.float32)
        try:
            ids[0, :n] = [self.phone_ids[p] for p in phones]
        except KeyError as exc:
            raise ValueError(f"Phone {exc} is not in the GOPT phone set") from exc

        with self._lock, torch.no_grad():
            u1, _u2, _u3, _u4, _u5, p, w1, _w2, _w3 = self._net(torch.from_numpy(x), torch.from_numpy(ids))

        return GoptScores(
            phone=[to_percent(v) for v in p[0, :n, 0].tolist()],
            word_accuracy_per_phone=[to_percent(v) for v in w1[0, :n, 0].tolist()],
            utterance_accuracy=to_percent(float(u1[0, 0])),
        )
