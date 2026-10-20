import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import { test } from "node:test";
import { describeSpawnError, looksLikeError, runCommand } from "../src/runner.ts";
import { Collector } from "./helpers.ts";

/** Sinks that swallow the child's live output so it doesn't clutter the test report. */
function silent() {
  return { stdout: new PassThrough().resume(), stderr: new PassThrough().resume() };
}

test("runCommand: successful command", async () => {
  const result = await runCommand(["echo", "hello"], silent());
  assert.deepEqual(result.exitCode, 0);
  assert.deepEqual(result.stdout.trim(), "hello");
});

test("runCommand: failing command", async () => {
  const result = await runCommand(["sh", "-c", "echo oops >&2; exit 1"], silent());
  assert.deepEqual(result.exitCode, 1);
  assert.deepEqual(result.stderr.trim(), "oops");
});

test("runCommand: captures stdout", async () => {
  const result = await runCommand(["sh", "-c", "echo line1; echo line2"], silent());
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
  await assert.rejects(runCommand(["eugene-no-such-command-xyz"], silent()), { code: "ENOENT" });
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

test("runCommand: streams output live while the command is still running", async () => {
  const dir = mkdtempSync(join(tmpdir(), "eugene-"));
  const flag = join(dir, "seen");
  // The child prints, then waits until the test has seen that output (up to 5s).
  const script = `
    console.log("hello");
    const fs = require("node:fs");
    const start = Date.now();
    const poll = setInterval(() => {
      if (fs.existsSync(${JSON.stringify(flag)})) { clearInterval(poll); process.exit(0); }
      if (Date.now() - start > 5000) { clearInterval(poll); process.exit(3); }
    }, 10);
  `;
  let streamed = "";
  const tee = new Writable({
    write(chunk, _enc, done) {
      streamed += chunk;
      writeFileSync(flag, "");
      done();
    },
  });
  try {
    const result = await runCommand([process.execPath, "-e", script], {
      stdout: tee,
      stderr: silent().stderr,
    });
    assert.equal(
      result.exitCode,
      0,
      `the child should exit once its output was seen live: ${result.stderr}`,
    );
    assert.equal(streamed, "hello\n");
    assert.equal(result.stdout, "hello\n", "output is still captured for analysis");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runCommand: tees stdout and stderr to the given streams separately", async () => {
  const out = new Collector();
  const err = new Collector();
  const result = await runCommand(
    [process.execPath, "-e", "console.log('to-out'); console.error('to-err'); process.exit(2)"],
    { stdout: out, stderr: err },
  );
  assert.equal(result.exitCode, 2);
  assert.equal(out.text.trim(), "to-out");
  assert.equal(err.text.trim(), "to-err");
  assert.equal(result.stderr.trim(), "to-err");
});
