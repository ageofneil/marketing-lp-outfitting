#!/usr/bin/env python3
"""
Watch for file changes and rebuild automatically.

Usage:
    python watch.py
"""

import subprocess
import sys
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

BASE_DIR = Path(__file__).parent.resolve()

WATCH_DIRS = ["pages", "css", "js", "assets", "templates"]
WATCH_FILES = ["config.json"]

IGNORE_DIRS = {"dist", "__pycache__", ".git"}


def rebuild():
    print("\nChange detected — rebuilding...", flush=True)
    result = subprocess.run(
        [sys.executable, "build.py"],
        cwd=BASE_DIR,
    )
    if result.returncode == 0:
        print("Ready.", flush=True)
    else:
        print("Build failed — check output above.", flush=True)


class ChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self._last = 0

    def on_any_event(self, event):
        if event.is_directory:
            return
        # Ignore dist/ and hidden files
        path = Path(event.src_path)
        if any(p in IGNORE_DIRS for p in path.parts):
            return
        if path.name.startswith("."):
            return
        # Debounce — ignore events within 300ms of the last one
        now = time.time()
        if now - self._last < 0.3:
            return
        self._last = now
        rebuild()


def main():
    print("Watching for changes. Press Ctrl+C to stop.\n", flush=True)
    rebuild()

    handler = ChangeHandler()
    observer = Observer()

    for d in WATCH_DIRS:
        path = BASE_DIR / d
        if path.exists():
            observer.schedule(handler, str(path), recursive=True)

    for f in WATCH_FILES:
        observer.schedule(handler, str(BASE_DIR / f), recursive=False)

    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
