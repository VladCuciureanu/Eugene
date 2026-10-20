import { eugeneSay, prompt } from "../prompt.ts";
import { isNegation } from "../sentiment.ts";

const DENIAL_RESPONSES = ["I understand. But it did happen.", "The logs don't lie."];

const FORCED_MOVE = "I admire your commitment to denial. But we need to move on.";

export async function denial(errorOutput: string): Promise<void> {
  eugeneSay(`The command failed. Here's what happened:`);
  eugeneSay("");

  const lines = errorOutput.trim().split("\n").slice(0, 10);
  for (const line of lines) {
    eugeneSay(`  ${line}`);
  }

  eugeneSay("");
  eugeneSay("Do you accept that this has happened?");

  // One reply per denial; the denial after the last reply gets you moved on anyway.
  for (const reply of DENIAL_RESPONSES) {
    if (!isNegation(await prompt())) {
      eugeneSay("Let's move on.");
      return;
    }
    eugeneSay(reply);
  }
  eugeneSay(isNegation(await prompt()) ? FORCED_MOVE : "Let's move on.");
}

export function denialNonInteractive(errorOutput: string): void {
  eugeneSay("The command failed.");
  const lines = errorOutput.trim().split("\n").slice(0, 5);
  for (const line of lines) {
    eugeneSay(`  ${line}`);
  }
  eugeneSay("You must accept this. Moving on.");
}
