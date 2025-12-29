import { angerNonInteractive } from "../../src/stages/anger.ts";

Deno.test("angerNonInteractive: runs without error", () => {
  angerNonInteractive();
});
