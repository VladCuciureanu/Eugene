import { griefSay, prompt } from "../prompt.ts";

export async function blame(): Promise<void> {
  griefSay("Before we move on — whose fault was this?");

  const response = await prompt();

  if (response.toLowerCase().includes("my") || response.toLowerCase().includes("mine") || response.toLowerCase().includes("me")) {
    griefSay("Self-awareness. Noted.");
  } else if (response.trim() === "") {
    griefSay("Silence. Also noted.");
  } else {
    griefSay(`${response.trim()}. Noted.`);
  }
}

export function blameNonInteractive(): void {
  griefSay("Someone is responsible for this. You know who.");
  griefSay("Noted.");
}
