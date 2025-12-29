import { griefSay, griefWarm, prompt } from "../prompt.ts";

export async function acceptance(mantra: string): Promise<void> {
  griefSay("Are you ready to try again?");
  await prompt();

  griefSay(`Say it with me: "${mantra}"`);

  while (true) {
    const response = await prompt();
    const normalized = response.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const mantraNormalized = mantra.toLowerCase().replace(/[^a-z\s]/g, "").trim();

    if (normalized.includes(mantraNormalized) || normalized.length > mantraNormalized.length * 0.5) {
      break;
    }
    griefSay("Try again. The full mantra.");
  }

  griefWarm("You may now retry your command. Go in peace.");
}

export function acceptanceNonInteractive(mantra: string): void {
  griefSay(`Remember: "${mantra}"`);
  griefSay("You may now retry your command. Go in peace.");
}
