import { eugeneSay, eugeneWarm, prompt } from "../prompt.ts";

export async function acceptance(mantra: string): Promise<void> {
  eugeneSay("Are you ready to try again?");
  await prompt();

  eugeneSay(`Say it with me: "${mantra}"`);

  while (true) {
    const response = await prompt();
    const normalized = response.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const mantraNormalized = mantra.toLowerCase().replace(/[^a-z\s]/g, "").trim();

    if (normalized.includes(mantraNormalized) || normalized.length > mantraNormalized.length * 0.5) {
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
