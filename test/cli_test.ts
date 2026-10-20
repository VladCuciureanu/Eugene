import assert from "node:assert/strict";
import { test } from "node:test";
import { checkEnv, parseArgs } from "../src/cli.ts";

// Stub process.stdin.isTTY to allow empty commands in tests
const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

function withNonTTY(fn: () => void) {
  Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
  try {
    fn();
  } finally {
    if (originalIsTTY) {
      Object.defineProperty(process.stdin, "isTTY", originalIsTTY);
    } else {
      delete (process.stdin as { isTTY?: boolean }).isTTY;
    }
  }
}

test("parseArgs: basic command after --", () => {
  const opts = parseArgs(["--", "npm", "test"]);
  assert.deepEqual(opts.command, ["npm", "test"]);
  assert.deepEqual(opts.pipeMode, false);
});

test("parseArgs: all flags", () => {
  const opts = parseArgs([
    "--hierarchical",
    "--speed",
    "fast",
    "--mantra",
    "bugs happen",
    "--skip-stage",
    "3",
    "--anger-room",
    "--",
    "make",
    "build",
  ]);
  assert.deepEqual(opts.hierarchical, true);
  assert.deepEqual(opts.speed, "fast");
  assert.deepEqual(opts.mantra, "bugs happen");
  assert.deepEqual(opts.skipStages, [3]);
  assert.deepEqual(opts.angerRoom, true);
  assert.deepEqual(opts.command, ["make", "build"]);
});

test("parseArgs: pipe mode when no command and not TTY", () => {
  withNonTTY(() => {
    const opts = parseArgs([]);
    assert.deepEqual(opts.pipeMode, true);
    assert.deepEqual(opts.command, []);
  });
});

test("parseArgs: default mantra", () => {
  const opts = parseArgs(["--", "echo", "hi"]);
  assert.deepEqual(opts.mantra, "The failure was not personal.");
});

test("parseArgs: multiple skip-stage", () => {
  const opts = parseArgs(["--skip-stage", "1", "--skip-stage", "4", "--", "ls"]);
  assert.deepEqual(opts.skipStages, [1, 4]);
});

test("checkEnv: normal run", () => {
  delete process.env.EUGENE_DISABLE;
  delete process.env.NO_EUGENE;
  assert.deepEqual(checkEnv(), "run");
});

test("checkEnv: EUGENE_DISABLE", () => {
  process.env.EUGENE_DISABLE = "1";
  assert.deepEqual(checkEnv(), "disable");
  delete process.env.EUGENE_DISABLE;
});

test("checkEnv: NO_EUGENE", () => {
  process.env.NO_EUGENE = "1";
  assert.deepEqual(checkEnv(), "disable-snark");
  delete process.env.NO_EUGENE;
});
