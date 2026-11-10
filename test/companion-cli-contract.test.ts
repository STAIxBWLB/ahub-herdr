import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as core from "../mod/core.js";
import * as card from "../mod/card.js";

// The contract copy (contract/companion-cli-v1.json, source in contract/SOURCE.md) is all this mod may assume about ahub's CLI (agent-hub#1387).
// These tests hold the readers (mod/core.js, mod/card.js) to it: every argv form, the no-hub prefix, the quoting, and every status and projects field they touch.
const ROOT = join(import.meta.dir, "..");
const contract = JSON.parse(readFileSync(join(ROOT, "contract/companion-cli-v1.json"), "utf8"));
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
const coreSrc = code(read("mod/core.js")), cardSrc = code(read("mod/card.js"));
const listed = (argv: string[]) => contract.commands.some((c: { bin?: string; argv: string[] }) => (c.bin ?? "ahub") === "ahub" && JSON.stringify(c.argv) === JSON.stringify(argv));

test("the contract copy is the version this mod was written against", () => {
  expect(contract.contract).toBe("companion-cli");
  expect(contract.version).toBe(1);
  expect(read("contract/SOURCE.md")).toMatch(/ahub version: \d+\.\d+\.\d+/);
});

test("every ahub command the mod runs or types is a listed argv form", () => {
  // the closed word lists the mod passes, and the selector it puts before them
  expect(core.PROGRAM).toBe("ahub");
  expect(core.FIXED.projects).toEqual(["projects", "--json"]);
  expect(core.FIXED.status).toEqual(["status", "--json"]);
  expect(core.FIXED.console).toEqual(["console"]);
  expect(core.FIXED.ui).toEqual(["ui"]);
  expect(core.projectArgs("p_id", core.FIXED.status)).toEqual(["--project", "p_id", "status", "--json"]);
  // listed: the list read, the status read, and the dashboard and console forms with a registration id or a root (the selector's placeholder is `<id|root>`)
  expect(listed(["projects", "--json"])).toBe(true);
  expect(listed(["--project", "<id|root>", "status", "--json"])).toBe(true);
  expect(listed(["--project", "<id|root>", "ui"])).toBe(true);
  expect(listed(["--project", "<id|root>", "console"])).toBe(true);
  expect(core.projectArgs("p_id", core.FIXED.ui)).toEqual(["--project", "p_id", "ui"]);
  expect(core.projectArgs("p_id", core.FIXED.console)).toEqual(["--project", "p_id", "console"]);
  // the typed copy-command: `ahub --project '<root>' console`, the same listed console form
  expect(coreSrc).toContain("command: `${PROGRAM} --project ${quoted} console`");
  // no other subcommand is ever passed
  expect(coreSrc + cardSrc).not.toMatch(/\bFIXED\.(board|tail|up|upgrade|stop|restart)\b|\["(board|tail|up|upgrade|stop|restart|send|hub)"/);
});

test("posixQuote gives every golden vector of the contract that it accepts", () => {
  expect(contract.shellQuote.length).toBeGreaterThanOrEqual(11);
  let checked = 0;
  for (const vector of contract.shellQuote) {
    const out = core.posixQuote(vector.in);
    if (out === null) { expect(vector.in === "" || /[\u0000-\u001f\u007f]/.test(vector.in), JSON.stringify(vector.in)).toBe(true); continue; }
    expect(out, JSON.stringify(vector.in)).toBe(vector.out); checked++;
  }
  // the empty string and the control character case are refused outright (null); every other vector must be accepted and equal
  expect(checked).toBeGreaterThanOrEqual(9);
});

test("the no-hub stderr prefix the mod tests for is the contract's, and exit code 1 is the one it relies on", () => {
  expect(coreSrc).toContain(`startsWith(${JSON.stringify(contract.noHub.stderrPrefix)})`);
  expect(contract.noHub.exitCode).toBe(1);
  // card.classifyRun: code 1 with the prefix is offline, any other failure is not
  expect(card.classifyRun({ rejected: false, result: { code: 1, stdout: "", stderr: "" }, stderrSaysNoHub: true })).toEqual({ kind: "offline" });
  expect(card.classifyRun({ rejected: false, result: { code: 2, stdout: "", stderr: "" }, stderrSaysNoHub: false })).toEqual({ kind: "failed" });
});

test("every status field the mod reads is a listed path, with the contract's closed sets", () => {
  const touched = new Set<string>();
  for (const m of cardSrc.matchAll(/\braw\.(\w+)/g)) touched.add(m[1]!);
  for (const m of cardSrc.matchAll(/\brow\.(state|queued|pullOnly|attached|needsReview|paused)\b/g)) touched.add(`peers.<id>.${m[1]}`);
  for (const m of coreSrc.matchAll(/\bstatus\.(projectId|cwd)\b/g)) touched.add(m[1]!);
  for (const m of coreSrc.matchAll(/\braw\.(cwd)\b/g)) touched.add(m[1]!);
  // a guard against the scan finding nothing: these are the paths the readers are known to use today
  expect([...touched].sort()).toEqual(["cwd", "peers", "peers.<id>.pullOnly", "peers.<id>.queued", "peers.<id>.state", "projectId", "tasks", "version"]);
  for (const path of touched) expect(contract.status[path], `${path} is not a listed status path`).toBeDefined();
  // the card's peer states are the contract's plus `unknown`; its task states are read as any lowercase word, which admits every state the contract lists
  expect(card.PEER_STATES.filter((s: string) => s !== "unknown")).toEqual(contract.status["peers.<id>.state"].values);
  for (const state of contract.status.tasks.values) expect(state).toMatch(/^[a-z_]{1,32}$/);
  expect(contract.status["peers.<id>.pullOnly"].type).toBe("true");
  // the mod never reads the paths it does not need
  expect(cardSrc + coreSrc).not.toMatch(/\.needs\b|\.needsReview\b|\.paused\b/);
});

test("every projects field the mod reads is a listed path, and the state words are the ones the contract names", () => {
  const touched = new Set<string>();
  for (const m of coreSrc.matchAll(/\brow\.(id|root|state)\b/g)) touched.add(`[].${m[1]}`);
  expect([...touched].sort()).toEqual(["[].id", "[].root", "[].state"]);
  for (const path of touched) expect(contract.projects[path], `${path} is not a listed projects path`).toBeDefined();
  expect(contract.projects["[].state"].presence).toMatch(/running and stopped/);
  // a state outside running and stopped reads as `unknown`, as the contract says readers do
  expect(coreSrc).toContain('row.state === "running" ? "running" : row.state === "stopped" ? "stopped" : "unknown"');
});
