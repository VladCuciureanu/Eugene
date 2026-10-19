import { test } from "node:test";
import { acceptanceNonInteractive } from "../../src/stages/acceptance.ts";

test("acceptanceNonInteractive: runs without error", () => {
  acceptanceNonInteractive("The failure was not personal.");
});

test("acceptanceNonInteractive: custom mantra", () => {
  acceptanceNonInteractive("Bugs are features in disguise.");
});
