# frontend/.claude

Working context and hard rules for an agent (Claude Code or Antigravity) doing work under
[`frontend/`](../). This folder is the frontend-scoped counterpart to the repository-root
[`.claude/`](../../.claude/): it concentrates the rules that apply to the web app in one place, so a
session opened directly in `frontend/` has everything it needs without hunting up the tree.

## Read this first when working on the frontend

When implementing a ticket or code change that touches `frontend/`, orient yourself in this order:

1. [../CLAUDE.md](../CLAUDE.md) - the always-on frontend context (loads in addition to the
   repo-root [../../CLAUDE.md](../../CLAUDE.md); every root invariant still applies).
2. [rules/engineering.md](rules/engineering.md) - the hard engineering rules: the client/server
   boundary, input validation, the two-sources honesty rule, data hygiene, and verify-before-done.
3. [rules/design-and-ux.md](rules/design-and-ux.md) - the hard design and UX rules: Material Design 3
   tokens, no hardcoded colours, accessibility and motion, and keeping the demo-versus-result
   distinction visible.
4. [../docs/](../docs/) - the full documentation set. Start at [../docs/README.md](../docs/README.md).
   Read [../docs/design-system.md](../docs/design-system.md) before any styling change and
   [../docs/api-and-server-reference.md](../docs/api-and-server-reference.md) before any route change.

## What this folder is not

- It does not override the repository-root rules. The root invariants in
  [../../CLAUDE.md](../../CLAUDE.md) and the shared rules in [../../.claude/rules/](../../.claude/rules/)
  remain in force. These files add frontend-specific depth; they never relax a root rule.
- It does not duplicate the whole design system or architecture. Those live in [../docs/](../docs/);
  the `rules/` files here are the short, enforceable checklist that points into them.
- The frontend's always-on context is [../CLAUDE.md](../CLAUDE.md), not a file in this folder. Keep
  narrative there and in `../docs/`; keep this folder to rules and this pointer.

## For Antigravity

The same routing applies. Antigravity's frontend context is [../GEMINI.md](../GEMINI.md), and the
shared workspace rules are in [../../.agents/rules/frontend.md](../../.agents/rules/frontend.md). The
design and engineering rules in `rules/` here are agent-neutral in content and apply to any agent
working on the app.
