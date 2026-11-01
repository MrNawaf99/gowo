"""Validation of incoming recordings.

The GoWord recorder already produces 16 kHz mono 16-bit PCM WAV, which is
exactly what the Kaldi front end needs, so the service performs no conversion:
anything else is rejected as INVALID_AUDIO rather than silently resampled.
"""

from __future__ import annotations

import io
import struct
import wave
from dataclasses import dataclass

import numpy as np

from .errors import ServiceError

SAMPLE_RATE = 16000
MIN_DURATION_S = 0.3
MAX_DURATION_S = 10.5  # client auto-stops at 10 s
MAX_BYTES = 1_000_000  # 10.5 s of 16 kHz PCM16 is ~336 kB

# Speech gate, applied before any Kaldi work so empty clips fail fast.
FRAME_S = 0.02
ACTIVE_FRAME_RMS = 0.01  # ~-40 dBFS
MIN_ACTIVE_S = 0.15
MIN_PEAK = 0.02


@dataclass(frozen=True)
class Recording:
    samples: np.ndarray  # float32 in [-1, 1]
    duration_s: float
    wav_bytes: bytes


def load_recording(data: bytes) -> Recording:
    if not data:
        raise ServiceError("INVALID_AUDIO", "Empty upload", 400)
    if len(data) > MAX_BYTES:
        raise ServiceError("INVALID_AUDIO", "Recording is too large", 413)
    if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ServiceError("INVALID_AUDIO", "Not a WAV file", 415)

    try:
        with wave.open(io.BytesIO(data), "rb") as wav:
            channels, width, rate, frames = wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()
            comptype = wav.getcomptype()
            pcm = wav.readframes(frames)
    except (wave.Error, EOFError, struct.error) as exc:
        raise ServiceError("INVALID_AUDIO", f"Unreadable WAV: {exc}", 400) from exc

    if comptype != "NONE" or width != 2 or channels != 1 or rate != SAMPLE_RATE:
        raise ServiceError(
            "INVALID_AUDIO",
            f"Expected 16 kHz mono 16-bit PCM, got {rate} Hz, {channels} ch, {width * 8}-bit, {comptype}",
            415,
        )

    samples = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
    duration_s = samples.size / SAMPLE_RATE
    if duration_s < MIN_DURATION_S:
        raise ServiceError("NO_SPEECH", "Recording is too short", 422)
    if duration_s > MAX_DURATION_S:
        raise ServiceError("INVALID_AUDIO", "Recording is too long", 413)

    if not has_speech(samples):
        raise ServiceError("NO_SPEECH", "No speech detected", 422)

    return Recording(samples=samples, duration_s=duration_s, wav_bytes=data)


def has_speech(samples: np.ndarray) -> bool:
    if samples.size == 0 or float(np.max(np.abs(samples))) < MIN_PEAK:
        return False
    frame = int(FRAME_S * SAMPLE_RATE)
    usable = samples[: samples.size - samples.size % frame].reshape(-1, frame)
    if usable.size == 0:
        return False
    rms = np.sqrt(np.mean(usable**2, axis=1))
    return float(np.count_nonzero(rms > ACTIVE_FRAME_RMS)) * FRAME_S >= MIN_ACTIVE_S
