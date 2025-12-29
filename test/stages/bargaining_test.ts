import { bargainingNonInteractive } from "../../src/stages/bargaining.ts";

Deno.test("bargainingNonInteractive: runs without error", () => {
  bargainingNonInteractive("Error: module 'foo' not found");
});

Deno.test("bargainingNonInteractive: handles empty error", () => {
  bargainingNonInteractive("");
});
