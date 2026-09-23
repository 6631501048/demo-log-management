#!/usr/bin/env python3
"""
samples/post_logs.py
Posts every sample JSON log file to the backend's POST /ingest endpoint.
Handles files that contain either a single object or an array of objects
(e.g. samples/logs/ad_events.json).

Usage:
    python3 post_logs.py                       # posts everything in samples/logs/
    python3 post_logs.py --url http://localhost:3000/ingest
"""
import argparse
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path


def post_one(url: str, record: dict) -> tuple[bool, str]:
    data = json.dumps(record).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return True, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode('utf-8')}"
    except urllib.error.URLError as e:
        return False, f"connection error: {e.reason}"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:3000/ingest")
    parser.add_argument(
        "--dir",
        default=str(Path(__file__).parent / "logs"),
        help="directory of *.json sample files",
    )
    args = parser.parse_args()

    log_dir = Path(args.dir)
    files = sorted(log_dir.glob("*.json"))
    if not files:
        print(f"No .json files found in {log_dir}", file=sys.stderr)
        sys.exit(1)

    ok_count, fail_count = 0, 0
    for f in files:
        content = json.loads(f.read_text())
        records = content if isinstance(content, list) else [content]
        for record in records:
            success, msg = post_one(args.url, record)
            status = "OK " if success else "FAIL"
            print(f"[{status}] {f.name} source={record.get('source')} -> {msg}")
            ok_count += 1 if success else 0
            fail_count += 0 if success else 1

    print(f"\nDone. ok={ok_count} fail={fail_count}")
    sys.exit(1 if fail_count else 0)


if __name__ == "__main__":
    main()
