import { test } from "node:test";
import { bargainingNonInteractive } from "../../src/stages/bargaining.ts";

test("bargainingNonInteractive: runs without error", () => {
  bargainingNonInteractive("Error: module 'foo' not found");
});

test("bargainingNonInteractive: handles empty error", () => {
  bargainingNonInteractive("");
});
