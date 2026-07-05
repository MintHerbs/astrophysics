#!/usr/bin/env python3
"""PreToolUse hook: block edits to the frozen submitted proposal.

Claude Code passes the tool-call payload as JSON on stdin. This hook reads the
target file and blocks any Edit or Write to docs.txt (the verbatim submitted
proposal, which is the project's frozen source of truth) by exiting with code 2,
the documented block mechanism. Every other file is allowed (exit 0).

Corrections that would otherwise change docs.txt belong in
docs/08-review-and-gaps.md and the working docs. See
.claude/rules/documentation.md and CLAUDE.md.

Registered in .claude/settings.json under hooks.PreToolUse. The git pre-commit
hook in .githooks/pre-commit is the commit-time backstop.
"""

from __future__ import annotations

import json
import os
import sys


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        # If the payload cannot be parsed, do not block (fail open). The
        # pre-commit hook still guards the commit.
        return 0

    tool_input = payload.get("tool_input") or {}
    file_path = str(tool_input.get("file_path") or "")
    if os.path.basename(file_path).lower() == "docs.txt":
        sys.stderr.write(
            "Blocked: docs.txt is the frozen submitted proposal and must not be edited. "
            "Record corrections in docs/08-review-and-gaps.md and the working docs instead. "
            "See .claude/rules/documentation.md.\n"
        )
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
