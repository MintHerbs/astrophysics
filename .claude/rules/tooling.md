# Required tooling: jCodemunch and jDocmunch MCP

> Related: [workflow.md](workflow.md) (human in the loop, verify before done).

jCodemunch-MCP (code navigation) and jDocmunch-MCP (documentation navigation) are required tools for
this repository. Before starting any task that involves exploring, reading, or editing code or
documentation here, confirm both servers are connected and the repo is indexed. Do not fall back to
Read, Grep, Glob, or Bash for exploration while the relevant server is available; see the setup guide
at [docs/09-tooling-setup.md](../../docs/09-tooling-setup.md) for installation and indexing steps.

## Required at the start of every session

1. `resolve_repo { "path": "." }` (jCodemunch) — confirm the code index exists. If not:
   `index_folder { "path": "<absolute repo path>" }`.
2. `doc_list_repos` or equivalent (jDocmunch) — confirm the `docs/` index exists. If not:
   `index_local { "path": "<absolute path>/docs" }`.
3. If either server is not connected, stop and tell the user before proceeding with code or doc
   work. Do not silently substitute the default tools for a repo-wide exploration task.

## Fallback

If a server is genuinely unavailable (not installed, not connected) for this session, fall back to
the default tools (Read, Grep, Glob, Bash) for that side only, and say so. This is the only
acceptable reason to skip jCodemunch or jDocmunch here.

## Scope

This rule applies repo-wide, including `frontend/`, `src/`, `data/`, and `docs/`. It does not relax
any other rule in [CLAUDE.md](../../CLAUDE.md) or the other files in this directory.
