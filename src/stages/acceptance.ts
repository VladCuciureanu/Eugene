import { eugeneSay, eugeneWarm, inputEnded, prompt } from "../prompt.ts";
import { isNegation } from "../sentiment.ts";

/** Lowercases and drops punctuation so only the words (and numbers) have to match. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function acceptance(mantra: string): Promise<void> {
  eugeneSay("Are you ready to try again?");
  while (isNegation(await prompt()) && !inputEnded()) {
    eugeneSay("Take your time. Healing isn't linear.");
    eugeneSay("Are you ready to try again?");
  }

  eugeneSay(`Say it with me: "${mantra}"`);

  const expected = normalize(mantra);
  while (normalize(await prompt()) !== expected) {
    if (inputEnded()) {
      eugeneSay("Silence. I'll take that as a yes.");
      break;
    }
    eugeneSay("Try again. The full mantra.");
  }

  eugeneWarm("You may now retry your command. Go in peace.");
}

export function acceptanceNonInteractive(mantra: string): void {
  eugeneSay(`Remember: "${mantra}"`);
  eugeneSay("You may now retry your command. Go in peace.");
}
