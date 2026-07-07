---
name: documentation-and-references
description: Rules for documentation reachability and scientific claims.
paths:
  - "**/*"
---

# Documentation and references (reachability)

> The reachability half of provenance: a source you cannot open is not a source. The always-on
> conventions, in short form, live in [GEMINI.md](../../GEMINI.md).

Every reference in the repo, the docs, or a commit message must be reachable by anyone on the project
and by any Antigravity instance. A reference that lives only on one person's machine or account is
not documentation.

Banned:

- Absolute machine paths (`C:\Users\...`, `D:\WORK\...`, `/Users/...`, `/home/...`), and anything
  under a personal Desktop, Downloads, or Documents folder.
- `file://` links to a local disk, and network shares only one person can reach.
- Personal cloud storage not shared with the team (a private Drive, Dropbox, OneDrive, or Notion, or
  an email attachment).
- `localhost` or `127.0.0.1` URLs and other single-machine endpoints.

Allowed (default to these):

- A repo-relative path (for example `docs/02-methodology.md`).
- A public, stable URL: a DOI, a MAST or NASA Exoplanet Archive page, a HITRAN or petitRADTRANS
  documentation page, a published paper, or a vendor doc.
- GitHub for code and pull requests.

Collaborators on a clean machine must be able to open every link in the docs and commits without
asking the author to send a file. Antigravity's own local memory and a developer's scratch or temp
files are tooling, not project documentation, as long as nothing in the repo references them.

## Scientific claims carry a source

Any physical value, cross-section, instrument parameter, detectability figure, or method choice
stated in the docs or code comments cites where it came from: a paper (with a DOI where possible), a
database (HITRAN2020, MAST, the NASA Exoplanet Archive), or the proposal at
[docs.txt](../../docs.txt). See the reference list in
[docs/06-references.md](../../docs/06-references.md). Do not state a number without a traceable basis.
