import assert from "node:assert/strict";
import { test } from "node:test";
import { denial, denialNonInteractive } from "../../src/stages/denial.ts";
import { withIo } from "../helpers.ts";

test("denial: shows the error and moves on once you stop denying it", async () => {
  await withIo({ answers: ["no", "NOPE", "...fine"] }, async (s) => {
    await denial("Error: something broke\n  at main.ts:5");
    const out = s.output();
    assert.match(out, /Eugene: {3}Error: something broke\nEugene: {5}at main\.ts:5\n/);
    assert.match(
      out,
      /I understand\. But it did happen\.[\s\S]*The logs don't lie\.[\s\S]*Let's move on\./,
    );
    assert.ok(!out.includes("commitment to denial"));
  });
});

test("denial: three denials and Eugene moves you on anyway", async () => {
  await withIo({ answers: ["no", "never", "impossible", "unused"] }, async (s) => {
    await denial("Error: x");
    const out = s.output();
    assert.match(out, /I admire your commitment to denial\. But we need to move on\.\n$/);
    assert.equal(out.split("> ").length - 1, 3);
  });
});

test("denial: shows at most 10 lines of the error", async () => {
  const error = Array.from({ length: 15 }, (_, i) => `line ${i + 1}`).join("\n");
  await withIo({ answers: ["ok"] }, async (s) => {
    await denial(error);
    assert.match(s.output(), /line 10\n/);
    assert.ok(!s.output().includes("line 11"));
  });
});

test("denialNonInteractive: shows up to 5 lines and insists", async () => {
  const error = Array.from({ length: 8 }, (_, i) => `line ${i + 1}`).join("\n");
  await withIo({}, (s) => {
    denialNonInteractive(error);
    const out = s.output();
    assert.match(out, /^Eugene: The command failed\.\nEugene: {3}line 1\n/);
    assert.match(out, /line 5\nEugene: You must accept this\. Moving on\.\n$/);
    assert.ok(!out.includes("line 6"));
  });
});

test("denialNonInteractive: handles empty error output", async () => {
  await withIo({}, (s) => {
    denialNonInteractive("");
    assert.match(s.output(), /You must accept this\. Moving on\.\n$/);
  });
});
