import { test } from "node:test";
import { angerNonInteractive } from "../../src/stages/anger.ts";

test("angerNonInteractive: runs without error", () => {
  angerNonInteractive();
});
