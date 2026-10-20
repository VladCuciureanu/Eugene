import type { Speed } from "../cli.ts";
import { delay, eugeneDim, timedPrint } from "../prompt.ts";

/** Runs the depression stage. Aborting `signal` (e.g. on Ctrl+C) skips the rest of it. */
export async function depression(speed: Speed, signal?: AbortSignal): Promise<void> {
  eugeneDim("...");
  await delay(5000, speed, signal);

  await timedPrint("It's okay to sit with this for a moment.", 3000, speed, signal);
  await timedPrint("Not every build succeeds. Not every test passes.", 2000, speed, signal);
  await timedPrint("And that's okay.", 2000, speed, signal);

  await delay(1000, speed, signal);
}

export function depressionNonInteractive(): void {
  eugeneDim("...");
  eugeneDim("Not every build succeeds. Not every test passes.");
  eugeneDim("And that's okay.");
}
