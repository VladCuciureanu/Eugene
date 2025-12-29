import { blameNonInteractive } from "../../src/stages/blame.ts";

Deno.test("blameNonInteractive: runs without error", () => {
  blameNonInteractive();
});
