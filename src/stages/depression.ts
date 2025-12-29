import type { Speed } from "../cli.ts";
import { griefDim, timedPrint, delay } from "../prompt.ts";

export async function depression(speed: Speed): Promise<void> {
  griefDim("...");
  await delay(5000, speed);

  await timedPrint("It's okay to sit with this for a moment.", 3000, speed);
  await timedPrint("Not every build succeeds. Not every test passes.", 2000, speed);
  await timedPrint("And that's okay.", 2000, speed);

  await delay(1000, speed);
}

export function depressionNonInteractive(): void {
  griefDim("...");
  griefDim("Not every build succeeds. Not every test passes.");
  griefDim("And that's okay.");
}
