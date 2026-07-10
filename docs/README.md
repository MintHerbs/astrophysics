# Documentation

The working documentation for this project, split into focused chunks. This is the readable narrative
of the research. The always-on context and rules live in [../CLAUDE.md](../CLAUDE.md) (repo root) and
the path-scoped rules in [../.claude/rules/](../.claude/rules/); where the two overlap, the rules
govern day-to-day work and these docs are the long-form background.

The submitted proposal is kept verbatim at [../docs.txt](../docs.txt) and is the source of truth. A
formatted, readable copy is at [proposal.md](proposal.md). Corrections identified since submission are
recorded in [08-review-and-gaps.md](08-review-and-gaps.md); the working docs (01 to 07) are the living
narrative and point back to it.

## Index: which chunk to read when

Load only the chunk relevant to the task.

| File | Covers | Read when |
| --- | --- | --- |
| [proposal.md](proposal.md) | The full submitted proposal as readable markdown | You want the complete original text in one place |
| [01-aims-and-objectives.md](01-aims-and-objectives.md) | The aim, the upper-limit framing, the gap, the objectives, the expected output | You need the high-level purpose, scope, or why upper limits |
| [02-methodology.md](02-methodology.md) | Research design, training-data generation, the hybrid inference model, biosignature extension, validation | You need the how: the scientific method and the modelling choices |
| [03-pipeline-overview.md](03-pipeline-overview.md) | The six pipeline stages as engineering blocks, mapped to `src/` | Building or scoping any stage; placing code |
| [04-data-sources.md](04-data-sources.md) | The two data streams (real archival, synthetic), inclusion criteria, tools, data hygiene | Any archive, query, catalogue, or data-handling work |
| [05-glossary.md](05-glossary.md) | Plain-language definitions of the science, method, and tool terms | You hit an unfamiliar term (MIRI, retrieval, NPE, upper limit, and so on) |
| [06-references.md](06-references.md) | The full reference list with reachable links where known | You need the source behind a claim or a tool |
| [07-roadmap.md](07-roadmap.md) | The task list, grouped by pipeline stage and objective, with status | Planning, prioritising, or picking up the next task |
| [08-review-and-gaps.md](08-review-and-gaps.md) | The internal review: fact-check, defect register, and corrections since submission | You need the evidence behind a correction, or to rerun the review |
| [09-tooling-setup.md](09-tooling-setup.md) | Installing and indexing jCodemunch and jDocmunch MCP | Starting a fresh session or setting up a new machine |

## Reading order for a newcomer

01 (aims) then 02 (methodology) then 03 (pipeline), with 05 (glossary) open alongside. Then 04 (data)
when touching the archive, 06 (references) for sources, and 07 (roadmap) for what to do next. Read
[proposal.md](proposal.md) or [../docs.txt](../docs.txt) for the complete original.
