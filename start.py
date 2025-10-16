#!/usr/bin/env python3
"""Convenience launcher to boot both backend (Django) and frontend (React)."""

from __future__ import annotations

import os
import signal
import subprocess
import sys
from pathlib import Path
from typing import List


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
BACKEND_MANAGE_DIR = BACKEND_DIR / "pythonScripts"
FRONTEND_DIR = ROOT / "frontend"


def run_process(cmd: List[str], cwd: Path, env: dict[str, str] | None = None) -> subprocess.Popen:
    """Spawn a child process in cwd and return the handle."""
    adjusted_env = os.environ.copy()
    if env:
        adjusted_env.update(env)

    # On Windows, npm is typically npm.cmd which still works without shell when found on PATH.
    return subprocess.Popen(
        cmd,
        cwd=str(cwd),
        env=adjusted_env,
    )


def main() -> int:
    print("Launching backend (Django) server...")
    backend_cmd = [sys.executable, "manage.py", "runserver"]
    backend_proc = run_process(backend_cmd, BACKEND_MANAGE_DIR)

    print("Launching frontend (React) dev server...")
    npm_executable = "npm.cmd" if os.name == "nt" else "npm"
    frontend_cmd = [npm_executable, "start"]
    frontend_proc = run_process(frontend_cmd, FRONTEND_DIR)

    processes = [backend_proc, frontend_proc]

    def shutdown(*_: object) -> None:
        print("\nStopping services...")
        for proc in processes:
            if proc.poll() is None:
                proc.terminate()

    # Handle Ctrl+C gracefully.
    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    # Wait on both processes.
    exit_codes = []
    try:
        for proc in processes:
            exit_codes.append(proc.wait())
    finally:
        shutdown()

    # Propagate a non-zero exit code if any child failed.
    for code in exit_codes:
        if code:
            return code
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
