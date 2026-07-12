# Frontend documentation: JWST MIRI Spectra Explorer

This folder is the working documentation for the frontend web app under [`frontend/`](../). It
describes what the app is for, how it is built, how it looks, and the rules a change must respect. It
is the frontend counterpart to the repository-wide [docs/](../../docs/) set, scoped to the viewer and
its local control surface.

Start here, then read the file that matches your task.

## Reading order

1. [objectives.md](objectives.md) - what the app is for, what it must never do, and the single
   honesty principle that governs the whole interface.
2. [architecture.md](architecture.md) - the stack, the client and server layers, the server
   boundary, and how data reaches the screen on every request.
3. [design-system.md](design-system.md) - the Material Design 3 (Material You) design language:
   colour tokens, the type and shape scales, elevation, motion, and accessibility. Read this before
   changing any styling or adding a component.
4. [ui-ux.md](ui-ux.md) - the interaction model: the source toggle, the four views, the populate
   flows, loading and empty and error states, and the copy rules.
5. [components.md](components.md) - a catalogue of every component and shared module, with its
   responsibility and where it lives.
6. [api-and-server-reference.md](api-and-server-reference.md) - a route-by-route reference for the
   API handlers and the server-only modules under `src/lib/server`.

## How this relates to the rest of the repo

- The always-on context for an agent working here is [../CLAUDE.md](../CLAUDE.md) (Claude Code) and
  [../GEMINI.md](../GEMINI.md) (Antigravity). Both load in addition to the repository-root context
  and inherit every root invariant.
- The enforceable hard rules live in [../.claude/rules/](../.claude/rules/) (frontend-scoped, for
  work opened directly under `frontend/`) and at the repo root in
  [../../.claude/rules/frontend.md](../../.claude/rules/frontend.md) and
  [../../.agents/rules/frontend.md](../../.agents/rules/frontend.md).
- The user-facing overview and getting-started guide is [../README.md](../README.md).
- The science this app annotates but never computes is described in the root
  [docs/](../../docs/) set. The frozen proposal is [docs.txt](../../docs.txt).

## Conventions for these docs

Written for humans, formally. Plain, professional language. No em dashes and no emoji, matching the
repository-wide convention in [../../CLAUDE.md](../../CLAUDE.md). Every reference is a repo-relative
path or a public, stable URL; never a local machine path.
