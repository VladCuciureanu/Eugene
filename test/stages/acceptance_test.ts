import { acceptanceNonInteractive } from "../../src/stages/acceptance.ts";

Deno.test("acceptanceNonInteractive: runs without error", () => {
  acceptanceNonInteractive("The failure was not personal.");
});

Deno.test("acceptanceNonInteractive: custom mantra", () => {
  acceptanceNonInteractive("Bugs are features in disguise.");
});
