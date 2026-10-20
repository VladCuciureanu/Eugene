import { eugeneSay, prompt } from "../prompt.ts";

export async function blame(): Promise<void> {
  eugeneSay("Before we move on — whose fault was this?");

  const response = await prompt();

  // Whole words only, so "James" or "Tommy" don't count as owning it.
  if (/\b(me|my|mine|myself)\b/i.test(response)) {
    eugeneSay("Self-awareness. Noted.");
  } else if (response.trim() === "") {
    eugeneSay("Silence. Also noted.");
  } else {
    eugeneSay(`${response.trim()}. Noted.`);
  }
}

export function blameNonInteractive(): void {
  eugeneSay("Someone is responsible for this. You know who.");
  eugeneSay("Noted.");
}
