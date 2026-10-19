import { test } from "node:test";
import { blameNonInteractive } from "../../src/stages/blame.ts";

test("blameNonInteractive: runs without error", () => {
  blameNonInteractive();
});
