import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("../src/main.ts", import.meta.url));

async function runEugene(
  args: string[],
  env?: Record<string, string>,
  stdin?: string | Buffer,
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

test("integration: EUGENE_DISABLE runs the command without the stages", async () => {
  const result = await runEugene(["--", "sh", "-c", "echo out; echo 'Error: boom' >&2; exit 3"], {
    EUGENE_DISABLE: "1",
  });
  assert.equal(result.code, 3, "the command's exit code is kept");
  assert.equal(result.stdout, "out\n", "the command ran");
  assert.equal(result.stderr, "Error: boom\n", "no stages");
});

test("integration: NO_EUGENE prints snark and runs the command without the stages", async () => {
  const result = await runEugene(["--", "sh", "-c", "echo out; exit 2"], {
    NO_EUGENE: "1",
  });
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "out\n");
  assert.ok(result.stderr.includes("Avoiding your emotions"), "Should print snark");
  assert.ok(!result.stderr.includes("Go in peace."), "no stages");
});

test("integration: EUGENE_DISABLE passes piped errors through without the stages", async () => {
  const result = await runEugene([], { EUGENE_DISABLE: "1" }, "Error: piped boom\n");
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "Error: piped boom\n");
  assert.equal(result.stderr, "");
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

test("integration: pipe mode keeps a multibyte character cut off at the end", async () => {
  // "ok €" with the last byte of the euro sign missing.
  const input = Buffer.from([0x6f, 0x6b, 0x20, 0xe2, 0x82]);
  const result = await runEugene([], undefined, input);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "ok \ufffd", "the broken character is replaced, not dropped");
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

test("integration: an option value that looks like an option gets a one-line error", async () => {
  const result = await runEugene(["--mantra", "-calm", "--", "echo", "hi"]);
  assert.equal(result.code, 1);
  assert.equal(
    result.stderr,
    "eugene: option '--mantra' got '-calm', which looks like an option; write --mantra=-calm\n",
  );
  assert.equal(result.stdout, "", "the command must not run");
});

test("integration: an option followed by another long option says it needs a value", async () => {
  const result = await runEugene(["--mantra", "--speed", "fast", "--", "echo", "hi"]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, "eugene: option '--mantra' needs a value\n");
  assert.equal(result.stdout, "", "the command must not run");
});

test("integration: --option=-value is accepted and the command's arguments pass through", async () => {
  const result = await runEugene(["--mantra=-calm", "--", "echo", "-calm", "--bogus"]);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "-calm --bogus\n");
  assert.equal(result.stderr, "");
});

test("integration: --help prints usage and exits 0", async () => {
  const result = await runEugene(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage:\n {2}eugene \[options\] -- <command>/);
});

/** Runs Eugene, closing its stdout as soon as the first output arrives, like `eugene ... | head -c 1`. */
async function runEugeneClosingStdout(
  args: string[],
  stdin = "",
): Promise<{ code: number; stderr: string }> {
  const proc = spawn(process.execPath, [MAIN, ...args], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stdin.end(stdin);
  proc.stdout.once("data", () => proc.stdout.destroy());
  let stderr = "";
  proc.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
  const code = await new Promise<number>((resolve, reject) => {
    proc.once("error", reject);
    proc.once("close", (code) => resolve(code ?? 1));
  });
  return { code, stderr };
}

test("integration: a closed stdout stops Eugene quietly with the command's exit code", async () => {
  // Writes until its own stdout breaks, then exits 3, as a command upstream of `head` would.
  const script = `
    process.stdout.on("error", () => process.exit(3));
    const chunk = "x".repeat(65536);
    (function write() {
      while (process.stdout.write(chunk));
      process.stdout.once("drain", write);
    })();`;
  const result = await runEugeneClosingStdout(["--", process.execPath, "-e", script]);
  assert.equal(result.stderr, "", "no crash, no stages");
  assert.equal(result.code, 3);
});

test("integration: a closed stdout in pipe mode still exits 1 when the input has errors", async () => {
  const input = "Error: boom\n".repeat(200_000);
  const result = await runEugeneClosingStdout(["--speed", "instant"], input);
  assert.ok(!result.stderr.includes("EPIPE"), `no crash: ${result.stderr.slice(-500)}`);
  assert.equal(result.code, 1, "pipefail users still learn that errors were found");
});

test("integration: a closed stdout in pipe mode exits 0 when the input is clean", async () => {
  const input = "all good\n".repeat(200_000);
  const result = await runEugeneClosingStdout([], input);
  assert.equal(result.stderr, "");
  assert.equal(result.code, 0);
});

test("integration: a closed stderr keeps a usage error's exit code", async () => {
  const proc = spawn(process.execPath, [MAIN, "--bogus"], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stderr.destroy();
  proc.stdin.end();
  proc.stdout.resume();
  const code = await new Promise<number>((resolve, reject) => {
    proc.once("error", reject);
    proc.once("close", (code) => resolve(code ?? -1));
  });
  assert.equal(code, 1);
});
