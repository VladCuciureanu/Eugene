import assert from "node:assert/strict";
import { test } from "node:test";
import { describeSpawnError, looksLikeError, runCommand } from "../src/runner.ts";

test("runCommand: successful command", async () => {
  const result = await runCommand(["echo", "hello"]);
  assert.deepEqual(result.exitCode, 0);
  assert.deepEqual(result.stdout.trim(), "hello");
});

test("runCommand: failing command", async () => {
  const result = await runCommand(["sh", "-c", "echo oops >&2; exit 1"]);
  assert.deepEqual(result.exitCode, 1);
  assert.deepEqual(result.stderr.trim(), "oops");
});

test("runCommand: captures stdout", async () => {
  const result = await runCommand(["sh", "-c", "echo line1; echo line2"]);
  assert.deepEqual(result.exitCode, 0);
  assert.deepEqual(result.stdout.trim(), "line1\nline2");
});

test("looksLikeError: detects error patterns", () => {
  assert.deepEqual(looksLikeError("Error: something went wrong"), true);
  assert.deepEqual(looksLikeError("FATAL: out of memory"), true);
  assert.deepEqual(looksLikeError("Traceback (most recent call last):"), true);
  assert.deepEqual(looksLikeError("compilation failed"), true);
  assert.deepEqual(looksLikeError("ENOENT: no such file"), true);
});

test("looksLikeError: passes clean output", () => {
  assert.deepEqual(looksLikeError("Build succeeded"), false);
  assert.deepEqual(looksLikeError("All tests passed"), false);
  assert.deepEqual(looksLikeError("Done in 1.2s"), false);
});

test("runCommand: rejects with ENOENT for an unknown command", async () => {
  await assert.rejects(runCommand(["eugene-no-such-command-xyz"]), { code: "ENOENT" });
});

test("describeSpawnError: friendly message for missing command", () => {
  const err = Object.assign(new Error("spawn nope ENOENT"), { code: "ENOENT" });
  const { message, exitCode } = describeSpawnError(["nope", "arg"], err);
  assert.deepEqual(exitCode, 127);
  assert.ok(message.includes("command not found: nope"));
  assert.ok(message.includes("--help"));
});

test("describeSpawnError: permission denied", () => {
  const err = Object.assign(new Error("spawn ./x EACCES"), { code: "EACCES" });
  assert.deepEqual(describeSpawnError(["./x"], err).exitCode, 126);
});
