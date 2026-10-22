"""Windows-only lifecycle fix for gltest's still-open stdin tempfile.

The SDK attempts POSIX unlink semantics after dup2(fd, 0). Windows rejects that
until its stdin handle is restored. Defer only that specific cleanup and retry
after the VM fixture teardown; no runtime/consensus behavior is replaced.
"""
import os
from pathlib import Path
import tempfile
import pytest


@pytest.fixture(autouse=True)
def windows_stdin_cleanup(monkeypatch):
    if os.name != "nt":
        yield
        return
    original = os.unlink
    pending = []
    temp = Path(tempfile.gettempdir()).resolve()
    def unlink(path, *args, **kwargs):
        try:
            return original(path, *args, **kwargs)
        except PermissionError as error:
            target = Path(path).resolve()
            if getattr(error, "winerror", None) != 32 or not target.is_relative_to(temp) or not target.name.startswith("tmp"):
                raise
            pending.append((path, args, kwargs))
    monkeypatch.setattr(os, "unlink", unlink)
    yield
    for path, args, kwargs in pending:
        try:
            original(path, *args, **kwargs)
        except (FileNotFoundError, PermissionError):
            pass
