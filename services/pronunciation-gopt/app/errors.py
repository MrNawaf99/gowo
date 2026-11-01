"""Service error type. Codes mirror GoWord's provider error codes."""

from __future__ import annotations

SERVICE_ERROR_CODES = {"INVALID_AUDIO", "NO_SPEECH", "UNSUPPORTED_TEXT", "NOT_READY", "BUSY", "INTERNAL", "UNAUTHORIZED"}


class ServiceError(Exception):
    def __init__(self, code: str, message: str, status: int):
        if code not in SERVICE_ERROR_CODES:
            raise ValueError(f"Unknown service error code {code}")
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status

    def to_body(self) -> dict:
        return {"error": {"code": self.code, "message": self.message}}
