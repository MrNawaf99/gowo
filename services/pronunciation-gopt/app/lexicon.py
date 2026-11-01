"""Reference text -> canonical phones.

Uses the LibriSpeech lexicon (the dictionary the acoustic model was trained
with). Words missing from it fall back to g2p-en so teachers are not limited
to the lexicon; the response reports which source was used.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

from .errors import ServiceError

MAX_WORDS = 12
_TOKEN = re.compile(r"[A-Z]+(?:'[A-Z]+)*")
_ARPABET = re.compile(r"^[A-Z]{1,2}[0-2]?$")


def phone_stress(symbol: str) -> Optional[int]:
    """Lexical stress carried by an ARPAbet symbol: 0, 1, 2, or None for consonants.

    In CMUdict the digit on a vowel is not decoration: on AH it selects the
    vowel quality (AH1/AH2 = /ʌ/ "cut", AH0 = /ə/ "about"). The GOP pipeline and
    the GOPT model both work on pure phones, so this is the only place that
    distinction survives, and it is reported alongside the pure phone rather
    than folded into it.
    """
    return int(symbol[-1]) if symbol and symbol[-1].isdigit() else None


@dataclass(frozen=True)
class WordPron:
    text: str  # word as it appears in the reference text
    lexicon_word: str  # uppercased lexicon key
    phones: tuple[str, ...]  # ARPAbet with stress, no position markers, e.g. ("TH", "R", "IY1")
    source: str  # "lexicon" | "g2p"

    @property
    def pure_phones(self) -> list[str]:
        return [re.sub(r"[0-2]$", "", p) for p in self.phones]

    @property
    def stresses(self) -> list[Optional[int]]:
        """Per-phone lexical stress, aligned 1:1 with `pure_phones`."""
        return [phone_stress(p) for p in self.phones]

    def kaldi_phones(self) -> list[str]:
        """Position-dependent phones as used by the LibriSpeech lang: _B, _I, _E, or _S."""
        n = len(self.phones)
        if n == 1:
            return [f"{self.phones[0]}_S"]
        return [f"{p}_{'B' if i == 0 else 'E' if i == n - 1 else 'I'}" for i, p in enumerate(self.phones)]


class Lexicon:
    def __init__(self, entries: dict[str, tuple[str, ...]], g2p: Optional[Callable[[str], list[str]]] = None):
        self._entries = entries
        self._g2p = g2p

    @classmethod
    def load(cls, path: Path, g2p: Optional[Callable[[str], list[str]]] = None) -> "Lexicon":
        entries: dict[str, tuple[str, ...]] = {}
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                parts = line.split()
                if len(parts) >= 2 and parts[0] not in entries:  # keep the first (most common) pronunciation
                    entries[parts[0]] = tuple(parts[1:])
        if not entries:
            raise RuntimeError(f"Lexicon {path} is empty")
        return cls(entries, g2p)

    def __len__(self) -> int:
        return len(self._entries)

    def tokenize(self, reference_text: str) -> list[tuple[str, list[str]]]:
        """Splits on whitespace exactly like GoWord does, so result words line up with GoWord's.

        Returns (display word, lexicon keys). A hyphenated word ("well-known") stays
        one GoWord word but is looked up as its parts (WELL, KNOWN). Other
        punctuation is dropped.
        """
        words: list[tuple[str, list[str]]] = []
        for raw in reference_text.replace("’", "'").split():
            keys = _TOKEN.findall(raw.upper())
            if not keys:
                continue
            display = re.sub(r"[^A-Za-z'-]", "", raw).strip("-'")
            words.append((display, keys))
        return words

    def pronounce(self, reference_text: str) -> list[list[WordPron]]:
        """One entry per GoWord word, each holding the lexicon parts it is aligned as."""
        if not reference_text or not reference_text.strip():
            raise ServiceError("UNSUPPORTED_TEXT", "Reference text is empty", 422)
        tokens = self.tokenize(reference_text)
        if not tokens:
            raise ServiceError("UNSUPPORTED_TEXT", "Reference text has no English words", 422)
        if sum(len(keys) for _, keys in tokens) > MAX_WORDS:
            raise ServiceError("UNSUPPORTED_TEXT", f"Reference text has more than {MAX_WORDS} words", 422)

        result: list[list[WordPron]] = []
        for display, keys in tokens:
            parts: list[WordPron] = []
            for key in keys:
                phones = self._entries.get(key)
                source = "lexicon"
                if phones is None:
                    phones = tuple(self._g2p_phones(key))
                    source = "g2p"
                parts.append(WordPron(text=display, lexicon_word=key, phones=phones, source=source))
            result.append(parts)
        return result

    def _g2p_phones(self, word: str) -> list[str]:
        if self._g2p is None:
            raise ServiceError("UNSUPPORTED_TEXT", f"'{word}' is not in the pronunciation dictionary", 422)
        phones = [p for p in self._g2p(word) if _ARPABET.match(p)]
        if not phones:
            raise ServiceError("UNSUPPORTED_TEXT", f"Could not derive a pronunciation for '{word}'", 422)
        return phones


def make_g2p() -> Callable[[str], list[str]]:
    """g2p-en (Apache-2.0). Imported lazily: it loads NLTK data at import time."""
    from g2p_en import G2p  # type: ignore

    g2p = G2p()
    return lambda word: [p for p in g2p(word.lower()) if p.strip()]
