import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = readFileSync(path.join(root, "App.tsx"), "utf8");
const css = readFileSync(path.join(root, "styles.css"), "utf8");
const actions = readFileSync(path.join(root, "../../server/src/actions.ts"), "utf8");

test("inspector probes all SDK and safe-area CSS variables", () => {
  for (const variable of [
    "--header-height",
    "--bottom-padding",
    "--hatch-space-bottom-padding",
    "--twsa-safe-area-inset-top",
    "--twsa-safe-area-inset-bottom",
    "env(safe-area-inset-top, 0px)",
    "env(safe-area-inset-bottom, 0px)",
  ]) {
    assert.ok(app.includes(variable), `expected App.tsx to probe ${variable}`);
  }
});

test("visual boundary guides and virtual-keyboard test composer are present", () => {
  assert.ok(app.includes('className="boundary-overlay-layer"'), "renders visual boundary overlay");
  assert.ok(app.includes('className="keyboard-test-prompt"'), "renders bottom virtual-keyboard test composer");
  assert.ok(css.includes('[data-keyboard-open="true"]'), "includes keyboard-open bottom padding override");
});

test("server actions expose viewer info and snapshot persistence", () => {
  assert.ok(actions.includes("getViewerInfo: defineAction("));
  assert.ok(actions.includes("listSnapshots: defineAction("));
  assert.ok(actions.includes("saveSnapshot: defineAction("));
  assert.ok(actions.includes("deleteSnapshot: defineAction("));
});
