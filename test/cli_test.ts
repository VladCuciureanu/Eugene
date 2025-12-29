import { assertEquals } from "jsr:@std/assert";
import { parseArgs, checkEnv } from "../src/cli.ts";

// Stub Deno.stdin.isTerminal to allow empty commands in tests
const originalIsTerminal = Deno.stdin.isTerminal;

function withNonTTY(fn: () => void) {
  Object.defineProperty(Deno.stdin, "isTerminal", { value: () => false, configurable: true });
  try {
    fn();
  } finally {
    Object.defineProperty(Deno.stdin, "isTerminal", {
      value: originalIsTerminal,
      configurable: true,
    });
  }
}

Deno.test("parseArgs: basic command after --", () => {
  const opts = parseArgs(["--", "npm", "test"]);
  assertEquals(opts.command, ["npm", "test"]);
  assertEquals(opts.pipeMode, false);
});

Deno.test("parseArgs: all flags", () => {
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
  assertEquals(opts.hierarchical, true);
  assertEquals(opts.speed, "fast");
  assertEquals(opts.mantra, "bugs happen");
  assertEquals(opts.skipStages, [3]);
  assertEquals(opts.angerRoom, true);
  assertEquals(opts.command, ["make", "build"]);
});

Deno.test("parseArgs: pipe mode when no command and not TTY", () => {
  withNonTTY(() => {
    const opts = parseArgs([]);
    assertEquals(opts.pipeMode, true);
    assertEquals(opts.command, []);
  });
});

Deno.test("parseArgs: default mantra", () => {
  const opts = parseArgs(["--", "echo", "hi"]);
  assertEquals(opts.mantra, "The failure was not personal.");
});

Deno.test("parseArgs: multiple skip-stage", () => {
  const opts = parseArgs(["--skip-stage", "1", "--skip-stage", "4", "--", "ls"]);
  assertEquals(opts.skipStages, [1, 4]);
});

Deno.test("checkEnv: normal run", () => {
  Deno.env.delete("GRIEF_DISABLE");
  Deno.env.delete("NO_GRIEF");
  assertEquals(checkEnv(), "run");
});

Deno.test("checkEnv: GRIEF_DISABLE", () => {
  Deno.env.set("GRIEF_DISABLE", "1");
  assertEquals(checkEnv(), "disable");
  Deno.env.delete("GRIEF_DISABLE");
});

Deno.test("checkEnv: NO_GRIEF", () => {
  Deno.env.set("NO_GRIEF", "1");
  assertEquals(checkEnv(), "disable-snark");
  Deno.env.delete("NO_GRIEF");
});
