import { griefSay, prompt } from "../prompt.ts";
import { generateSuggestions } from "../suggestions.ts";

export async function bargaining(errorOutput: string): Promise<void> {
  const suggestions = generateSuggestions(errorOutput, 3);

  for (const suggestion of suggestions) {
    griefSay(`What if you just ${suggestion}`);
    await prompt();
  }

  griefSay("Good. Let's work with what we have.");
}

export function bargainingNonInteractive(errorOutput: string): void {
  const suggestions = generateSuggestions(errorOutput, 2);
  for (const suggestion of suggestions) {
    griefSay(`What if you just ${suggestion}`);
  }
  griefSay("...no. Let's work with what we have.");
}
