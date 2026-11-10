# Changelog

## Unreleased

- Brought up from `integrations/herdr/` of STAIxBWLB/agent-hub at commit `16b8251657a2196a472aa3c578450489286637d7` (STAIxBWLB/agent-hub#1387, T2). No behaviour change. The mod stays in `mod/`.
- Added `contract/companion-cli-v1.json` (copied from agent-hub PR #1388 head `b2ec055d504658e3d280a64c3810bc79f494352d`, ahub 0.37.0 unreleased; see `contract/SOURCE.md`) and `test/companion-cli-contract.test.ts`. It records one gap in v1: the mod runs `--project <id> ui` and `--project <id> console`, which v1 does not list.
- The ahub-side cases (the `src/` scan, the ahub-side half of the independence test, the `docs/dogfood.md` read) stay in agent-hub or are dropped; the cross-companion scan covers this repository's own shipped files.
- Added CI: `bun test` only. `herdr-app check` stays a person-run step.

## 0.1.0

Not tagged yet. The tag needs the person's release consent (STAIxBWLB/agent-hub#1387).
