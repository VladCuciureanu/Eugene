import { griefSay, prompt } from "../prompt.ts";
import { isNegation } from "../sentiment.ts";

const DENIAL_RESPONSES = [
  "I understand. But it did happen.",
  "The logs don't lie.",
  "I know it's hard to accept.",
];

const FORCED_MOVE = "I admire your commitment to denial. But we need to move on.";

export async function denial(errorOutput: string): Promise<void> {
  griefSay(`The command failed. Here's what happened:`);
  griefSay("");

  const lines = errorOutput.trim().split("\n").slice(0, 10);
  for (const line of lines) {
    griefSay(`  ${line}`);
  }

  griefSay("");
  griefSay("Do you accept that this has happened?");

  let denials = 0;
  const maxDenials = 3;

  while (denials < maxDenials) {
    const response = await prompt();
    if (!isNegation(response)) {
      griefSay("Let's move on.");
      return;
    }
    denials++;
    if (denials >= maxDenials) {
      griefSay(FORCED_MOVE);
      return;
    }
    griefSay(DENIAL_RESPONSES[denials - 1] ?? DENIAL_RESPONSES[0]);
  }
}

export function denialNonInteractive(errorOutput: string): void {
  griefSay("The command failed.");
  const lines = errorOutput.trim().split("\n").slice(0, 5);
  for (const line of lines) {
    griefSay(`  ${line}`);
  }
  griefSay("You must accept this. Moving on.");
}
