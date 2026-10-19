import { test } from "node:test";
import { denialNonInteractive } from "../../src/stages/denial.ts";

test("denialNonInteractive: runs without error", () => {
  // Should print to stderr and not throw
  denialNonInteractive("Error: something broke\n  at main.ts:5");
});

test("denialNonInteractive: handles empty error", () => {
  denialNonInteractive("");
});
