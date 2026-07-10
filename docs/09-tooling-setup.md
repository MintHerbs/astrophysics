# Tooling setup: jCodemunch and jDocmunch MCP

jCodemunch-MCP (code) and jDocmunch-MCP (documentation) are required exploration tools for this
repository; see [.claude/rules/tooling.md](../.claude/rules/tooling.md) for the working rule. This
guide covers installing, connecting, and indexing both servers from a clean machine.

## What they are

- **jCodemunch-MCP**: indexes the repository's source code (ASTs, symbols, call graphs, imports) and
  exposes navigation tools (`search_symbols`, `find_references`, `get_symbol_source`,
  `get_blast_radius`, and others) over MCP.
- **jDocmunch-MCP**: indexes the repository's markdown documentation into sections and exposes
  retrieval tools (`search_sections`, `get_doc`, `get_toc`, `get_related_sections`, and others) over
  MCP.

Both run as local stdio MCP servers, launched on demand by the MCP client (Claude Code). Neither
uploads repository content anywhere by default; indexing writes to local storage on this machine.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) installed, so that `uvx` is on `PATH`. `uvx` runs a Python tool
  in an isolated environment without a manual install step.
- An MCP-capable client (Claude Code) with permission to launch local stdio MCP servers.

Check `uvx` is available:

```
uvx --version
```

If it is missing, install `uv` per the [official instructions](https://docs.astral.sh/uv/getting-started/installation/),
then re-open the shell so `PATH` picks it up.

## 1. Register the servers

Register both servers in an [.mcp.json](../.mcp.json) file at the repo root (create it if absent).
`.mcp.json` is a local, per-machine file and is not tracked in version control, so add this block
yourself on a fresh checkout:

```json
{
  "mcpServers": {
    "jcodemunch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["jcodemunch-mcp"]
    },
    "jdocmunch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["jdocmunch-mcp"]
    }
  }
}
```

Most MCP clients (Claude Code included) auto-load a project-level `.mcp.json` from the repo root. If
your client does not, add the same block to that client's own MCP configuration instead.

## 2. Start a session and confirm the servers are connected

Open Claude Code in the repo root. On startup, or via `/mcp` in an interactive session, confirm both
`jcodemunch` and `jdocmunch` show as connected. If either is not connected:

- Confirm `uvx jcodemunch-mcp` (or `uvx jdocmunch-mcp`) runs standalone in a terminal without error.
  The first run downloads the package; subsequent runs are fast.
- Confirm the client has permission to launch local MCP servers (check client-level MCP permission
  settings, not just this repo's `.mcp.json`).

## 3. Index the code

From within the session, resolve and index the repo:

```
resolve_repo { "path": "." }
```

If this reports no existing index, index the folder:

```
index_folder { "path": "<absolute path to repo root>" }
```

Use an absolute path; a relative path resolves against the MCP server's working directory, which may
not match the client's. Re-running `index_folder` is safe and incremental by default (only changed
files are re-indexed).

## 4. Index the documentation

```
index_local { "path": "<absolute path to repo root>/docs" }
```

This indexes [docs/](.) into sections for retrieval. Re-run after significant doc changes; it is
incremental by default. The frozen submission at [../docs.txt](../docs.txt) can also be indexed
separately if needed, but is not edited (see [documentation.md](../.claude/rules/documentation.md)).

## 5. Re-index after edits

- If PostToolUse hooks are installed for Claude Code, edited files are reindexed automatically.
- Otherwise, call `register_edit` (jCodemunch) with the paths of any files you changed to invalidate
  stale cache entries. For five or more changed files in one batch, pass them all to a single
  `register_edit` call rather than one call per file.
- Re-run `index_local` on `docs/` after a documentation edit if no equivalent auto-reindex hook is
  configured for jDocmunch.

## Everyday use

Prefer these tools over Read, Grep, Glob, or Bash for exploration whenever both servers are
connected, per [.claude/rules/tooling.md](../.claude/rules/tooling.md). Typical entry points:

- New or unfamiliar task: `plan_turn { "repo": "...", "query": "<task>", "model": "<model-id>" }`
  (jCodemunch) to get a confidence level and recommended files before searching further.
- Find a symbol by name: `search_symbols`.
- Find a string, comment, or config value: `search_text`.
- Read a file: `get_file_outline` first, then `get_symbol_source` for the relevant symbols.
- Find a doc section: `search_sections` or `get_toc` (jDocmunch).

`Read` is still used to open a file immediately before `Edit` or `Write`, since the harness requires
a `Read` before those tools will succeed; jCodemunch and jDocmunch are for finding and understanding
code or docs, not for the mechanical read-before-edit step.

## Troubleshooting

- **`uvx: command not found`**: `uv` is not installed or not on `PATH`. Reinstall `uv` and restart
  the shell.
- **Server listed but not connecting**: check the client's MCP server logs; a common cause is a stale
  cached version of the package. Running `uvx jcodemunch-mcp` (or `jdocmunch-mcp`) directly in a
  terminal surfaces the underlying error.
- **Index looks stale after a pull or branch switch**: re-run `index_folder` / `index_local`;
  incremental indexing detects changed files by content, so a fresh run after a branch switch is
  inexpensive.
- **Server unavailable in this session and cannot be fixed immediately**: fall back to Read, Grep,
  Glob, and Bash for that side only, and say so, per
  [.claude/rules/tooling.md](../.claude/rules/tooling.md).
