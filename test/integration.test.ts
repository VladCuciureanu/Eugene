import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("../src/main.ts", import.meta.url));

async function runEugene(
  args: string[],
  env?: Record<string, string>,
  stdin?: string,
): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  const proc = spawn(process.execPath, [MAIN, ...args], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  proc.stdin.end(stdin ?? "");
  let stdout = "";
  let stderr = "";
  proc.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
  proc.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
  const code = await new Promise<number>((resolve, reject) => {
    proc.once("error", reject);
    proc.once("close", (code) => resolve(code ?? 1));
  });
  return { code, stdout, stderr };
}

test("integration: successful command passes through", async () => {
  const result = await runEugene(["--", "echo", "hello"]);
  assert.deepEqual(result.code, 0);
  assert.deepEqual(result.stdout.trim(), "hello");
});

test("integration: failed command triggers Eugene (non-interactive)", async () => {
  const result = await runEugene(["--", "sh", "-c", "echo 'Error: boom' >&2; exit 1"]);
  assert.deepEqual(result.code, 1);
  assert.ok(result.stderr.includes("Eugene:"), "Should contain Eugene output");
  assert.ok(result.stderr.includes("boom"), "Should contain error output");
});

test("integration: EUGENE_DISABLE skips everything", async () => {
  const result = await runEugene(["--", "sh", "-c", "exit 1"], {
    EUGENE_DISABLE: "1",
  });
  assert.deepEqual(result.code, 0);
});

test("integration: NO_EUGENE prints snark", async () => {
  const result = await runEugene(["--", "sh", "-c", "exit 1"], {
    NO_EUGENE: "1",
  });
  assert.deepEqual(result.code, 0);
  assert.ok(result.stderr.includes("Avoiding your emotions"), "Should print snark");
});

test("integration: skip-stage works", async () => {
  const result = await runEugene([
    "--skip-stage",
    "1",
    "--skip-stage",
    "2",
    "--skip-stage",
    "3",
    "--skip-stage",
    "4",
    "--skip-stage",
    "5",
    "--",
    "sh",
    "-c",
    "echo 'Error: oops' >&2; exit 1",
  ]);
  assert.deepEqual(result.code, 1);
  assert.ok(
    result.stderr.includes("Skipping") || result.stderr.includes("counselors"),
    `Should mention skipping. Got: ${result.stderr.slice(0, 500)}`,
  );
});

test("integration: unknown command prints a friendly error without a stack trace", async () => {
  const result = await runEugene(["--", "eugene-no-such-command-xyz"]);
  assert.deepEqual(result.code, 127);
  assert.ok(
    result.stderr.includes("command not found: eugene-no-such-command-xyz"),
    "Should explain the command was not found",
  );
  assert.ok(!/\n\s+at /.test(result.stderr), "Should not print a stack trace");
  assert.ok(!result.stderr.includes("ErrnoException"), "Should not leak internals");
});

test("integration: pipe mode passes clean input through untouched", async () => {
  const result = await runEugene([], undefined, "all good\n");
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "all good\n");
  assert.ok(!result.stderr.includes("Eugene:"));
});

test("integration: pipe mode without a visible terminal grieves non-interactively", async () => {
  // stderr is a pipe here, so Eugene must not wait for answers from the terminal.
  const result = await runEugene([], undefined, "Error: piped boom\n");
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "Error: piped boom\n", "the piped input is passed on");
  assert.ok(result.stderr.includes("piped boom"), "the error is shown in denial");
  assert.ok(result.stderr.includes("Go in peace."), "all stages run to the end");
});

test("integration: invalid option exits 1 with a message and no stack trace", async () => {
  const result = await runEugene(["--speed", "ludicrous", "--", "echo", "hi"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^eugene: invalid speed 'ludicrous'/);
  assert.ok(!/\n\s+at /.test(result.stderr), "Should not print a stack trace");
  assert.equal(result.stdout, "", "the command must not run");
});

test("integration: unknown option exits 1 with a one-line usage error", async () => {
  const result = await runEugene(["--bogus", "--", "echo", "hi"]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, "eugene: unknown option '--bogus'\n");
  assert.equal(result.stdout, "", "the command must not run");
});

test("integration: --help prints usage and exits 0", async () => {
  const result = await runEugene(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage:\n {2}eugene \[options\] -- <command>/);
});
