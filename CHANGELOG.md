# Changelog

## Unreleased

## 0.1.0

- Brought up from `integrations/herdr/` of STAIxBWLB/agent-hub at commit `16b8251657a2196a472aa3c578450489286637d7` (STAIxBWLB/agent-hub#1387, T2). No behaviour change. The mod stays in `mod/`.
- Added `contract/companion-cli-v1.json` (copied from agent-hub PR #1388 head `0c427dd06a600fb0003977a8bde75bec097eb3e9`, ahub 0.37.0 unreleased; see `contract/SOURCE.md`) and `test/companion-cli-contract.test.ts`.
- The ahub-side cases (the `src/` scan, the ahub-side half of the independence test, the `docs/dogfood.md` read) stay in agent-hub or are dropped; the cross-companion scan covers this repository's own shipped files.
- Added CI: `bun test` only. `herdr-app check` stays a person-run step.

