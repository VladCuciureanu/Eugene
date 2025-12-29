import { assertEquals } from "jsr:@std/assert";
import { runCommand, looksLikeError } from "../src/runner.ts";

Deno.test("runCommand: successful command", async () => {
  const result = await runCommand(["echo", "hello"]);
  assertEquals(result.exitCode, 0);
  assertEquals(result.stdout.trim(), "hello");
});

Deno.test("runCommand: failing command", async () => {
  const result = await runCommand(["sh", "-c", "echo oops >&2; exit 1"]);
  assertEquals(result.exitCode, 1);
  assertEquals(result.stderr.trim(), "oops");
});

Deno.test("runCommand: captures stdout", async () => {
  const result = await runCommand(["sh", "-c", "echo line1; echo line2"]);
  assertEquals(result.exitCode, 0);
  assertEquals(result.stdout.trim(), "line1\nline2");
});

Deno.test("looksLikeError: detects error patterns", () => {
  assertEquals(looksLikeError("Error: something went wrong"), true);
  assertEquals(looksLikeError("FATAL: out of memory"), true);
  assertEquals(looksLikeError("Traceback (most recent call last):"), true);
  assertEquals(looksLikeError("compilation failed"), true);
  assertEquals(looksLikeError("ENOENT: no such file"), true);
});

Deno.test("looksLikeError: passes clean output", () => {
  assertEquals(looksLikeError("Build succeeded"), false);
  assertEquals(looksLikeError("All tests passed"), false);
  assertEquals(looksLikeError("Done in 1.2s"), false);
});
