import { test } from "node:test";
import { depressionNonInteractive } from "../../src/stages/depression.ts";

test("depressionNonInteractive: runs without error", () => {
  depressionNonInteractive();
});
