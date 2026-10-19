import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const MAIN = fileURLToPath(new URL("../src/main.ts", import.meta.url));

async function runEugene(args: string[], env?: Record<string, string>): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  const proc = spawn(process.execPath, [MAIN, ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
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
    "--skip-stage", "1",
    "--skip-stage", "2",
    "--skip-stage", "3",
    "--skip-stage", "4",
    "--skip-stage", "5",
    "--", "sh", "-c", "echo 'Error: oops' >&2; exit 1",
  ]);
  assert.deepEqual(result.code, 1);
  assert.ok(
    result.stderr.includes("Skipping") || result.stderr.includes("counselors"),
    "Should mention skipping. Got: " + result.stderr.slice(0, 500)
  );
});
