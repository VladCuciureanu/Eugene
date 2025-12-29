import { griefSay, prompt } from "../prompt.ts";
import { isCalm } from "../sentiment.ts";

const EMPATHY_RESPONSES = [
  "I hear you.",
  "That must be incredibly frustrating.",
  "Valid.",
  "Absolutely valid.",
  "Your anger is justified.",
  "Let it all out.",
  "The compiler had it coming.",
];

const MIN_MESSAGES = 2;
const MAX_MESSAGES = 5;

export async function anger(angerRoom: boolean): Promise<void> {
  griefSay("It's okay to be angry. Let it out.");

  let messages = 0;

  while (true) {
    const response = await prompt();
    messages++;

    if (angerRoom) {
      if (response.toLowerCase().trim() === "i'm done" || response.toLowerCase().trim() === "im done") {
        griefSay("Good. You've processed it.");
        return;
      }
      griefSay(EMPATHY_RESPONSES[messages % EMPATHY_RESPONSES.length]);
      continue;
    }

    if (messages >= MAX_MESSAGES) {
      griefSay("Good. Feel that. Now breathe.");
      return;
    }

    if (messages >= MIN_MESSAGES && isCalm(response)) {
      griefSay("Good. You're calming down. Let's keep going.");
      return;
    }

    griefSay(EMPATHY_RESPONSES[messages % EMPATHY_RESPONSES.length]);
  }
}

export function angerNonInteractive(): void {
  griefSay("It's okay to be angry. We'll skip the venting this time.");
  griefSay("But know that your anger is valid.");
}
