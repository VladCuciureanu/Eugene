import { depressionNonInteractive } from "../../src/stages/depression.ts";

Deno.test("depressionNonInteractive: runs without error", () => {
  depressionNonInteractive();
});
