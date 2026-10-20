import { eugeneSay, prompt } from "../prompt.ts";

export async function blame(): Promise<void> {
  // Blame comes after acceptance has already sent you off in peace.
  eugeneSay("One more thing — whose fault was this?");

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
