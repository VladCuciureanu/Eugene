import { denialNonInteractive } from "../../src/stages/denial.ts";

Deno.test("denialNonInteractive: runs without error", () => {
  // Should print to stderr and not throw
  denialNonInteractive("Error: something broke\n  at main.ts:5");
});

Deno.test("denialNonInteractive: handles empty error", () => {
  denialNonInteractive("");
});
