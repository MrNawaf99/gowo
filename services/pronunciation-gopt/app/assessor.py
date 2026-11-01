"""Reference text + recording -> normalised v1 assessment."""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Protocol

import numpy as np

from .audio import Recording
from .errors import ServiceError
from .gopt_model import GoptModel
from .lexicon import Lexicon, WordPron

ENGINE_NAME = "gopt-librispeech"


class AlignmentError(Exception):
    """The recording could not be aligned to the reference phones (unassessable)."""


class GopExtractor(Protocol):
    def extract(self, recording: Recording, words: list[WordPron]) -> np.ndarray:
        """Returns [n_canonical_phones, 84] GOP features, rows in canonical phone order."""
        ...


@dataclass
class Assessor:
    lexicon: Lexicon
    extractor: GopExtractor
    model: GoptModel
    engine_version: str

    def assess(self, reference_text: str, recording: Recording) -> dict:
        started = time.perf_counter()
        groups = self.lexicon.pronounce(reference_text)
        parts = [part for group in groups for part in group]

        try:
            features = self.extractor.extract(recording, parts)
        except AlignmentError as exc:
            raise ServiceError("NO_SPEECH", f"Speech could not be matched to the reference: {exc}", 422) from exc

        pure = [p for part in parts for p in part.pure_phones]
        # Reported next to the pure phone, never folded into it: GoWord needs the
        # digit to tell /ʌ/ (AH1/AH2) from /ə/ (AH0), which the pure phone cannot.
        stresses = [s for part in parts for s in part.stresses]
        if features.shape[0] != len(pure):
            raise ServiceError(
                "NO_SPEECH",
                f"Alignment produced {features.shape[0]} phones, expected {len(pure)}",
                422,
            )

        try:
            scores = self.model.score(features, pure)
        except ValueError as exc:
            raise ServiceError("INTERNAL", f"Model input error: {exc}", 500) from exc

        words = []
        cursor = 0
        for group in groups:
            count = sum(len(part.phones) for part in group)
            span = slice(cursor, cursor + count)
            cursor += count
            phone_scores = scores.phone[span]
            words.append(
                {
                    "text": group[0].text,
                    # traintest.py reports word accuracy as the mean over the word's phone positions.
                    "accuracy": round(float(np.mean(scores.word_accuracy_per_phone[span])), 1),
                    "phones": [
                        {"phone": phone, "stress": stress, "accuracy": round(score, 1)}
                        for phone, stress, score in zip(pure[span], stresses[span], phone_scores)
                    ],
                    "pronunciation_source": "g2p" if any(p.source == "g2p" for p in group) else "lexicon",
                }
            )

        return {
            "reference_text": reference_text,
            "words": words,
            "utterance": {"accuracy": round(scores.utterance_accuracy, 1)},
            "duration_ms": round(recording.duration_s * 1000),
            "processing_ms": round((time.perf_counter() - started) * 1000),
            "engine": {"name": ENGINE_NAME, "version": self.engine_version},
        }


def safe_reference_text(value: str) -> str:
    """Rejects text the Kaldi data files cannot represent safely (newlines, control chars)."""
    if value is None or not value.strip():
        raise ServiceError("UNSUPPORTED_TEXT", "reference_text is required", 422)
    if len(value) > 120 or re.search(r"[\x00-\x1f\x7f]", value):
        raise ServiceError("UNSUPPORTED_TEXT", "reference_text is too long or contains control characters", 422)
    return value
