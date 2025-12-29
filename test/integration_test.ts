import { assertEquals, assert } from "jsr:@std/assert";

const MAIN = new URL("../src/main.ts", import.meta.url).pathname;

async function runEugene(args: string[], env?: Record<string, string>): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  const proc = new Deno.Command("deno", {
    args: ["run", "--allow-all", MAIN, ...args],
    stdout: "piped",
    stderr: "piped",
    env,
  });
  const output = await proc.output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

Deno.test("integration: successful command passes through", async () => {
  const result = await runEugene(["--", "echo", "hello"]);
  assertEquals(result.code, 0);
  assertEquals(result.stdout.trim(), "hello");
});

Deno.test("integration: failed command triggers Eugene (non-interactive)", async () => {
  const result = await runEugene(["--", "sh", "-c", "echo 'Error: boom' >&2; exit 1"]);
  assertEquals(result.code, 1);
  assert(result.stderr.includes("Eugene:"), "Should contain Eugene output");
  assert(result.stderr.includes("boom"), "Should contain error output");
});

Deno.test("integration: EUGENE_DISABLE skips everything", async () => {
  const result = await runEugene(["--", "sh", "-c", "exit 1"], {
    EUGENE_DISABLE: "1",
  });
  assertEquals(result.code, 0);
});

Deno.test("integration: NO_EUGENE prints snark", async () => {
  const result = await runEugene(["--", "sh", "-c", "exit 1"], {
    NO_EUGENE: "1",
  });
  assertEquals(result.code, 0);
  assert(result.stderr.includes("Avoiding your emotions"), "Should print snark");
});

Deno.test("integration: skip-stage works", async () => {
  const result = await runEugene([
    "--skip-stage", "1",
    "--skip-stage", "2",
    "--skip-stage", "3",
    "--skip-stage", "4",
    "--skip-stage", "5",
    "--", "sh", "-c", "echo 'Error: oops' >&2; exit 1",
  ]);
  assertEquals(result.code, 1);
  assert(
    result.stderr.includes("Skipping") || result.stderr.includes("counselors"),
    "Should mention skipping. Got: " + result.stderr.slice(0, 500)
  );
});
