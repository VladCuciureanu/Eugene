import type { EugeneOptions } from "../cli.ts";
import { eugeneSay, print } from "../prompt.ts";
import { acceptance, acceptanceNonInteractive } from "./acceptance.ts";
import { anger, angerNonInteractive } from "./anger.ts";
import { bargaining, bargainingNonInteractive } from "./bargaining.ts";
import { blame, blameNonInteractive } from "./blame.ts";
import { denial, denialNonInteractive } from "./denial.ts";
import { depression, depressionNonInteractive } from "./depression.ts";

const STAGE_NAMES = ["denial", "anger", "bargaining", "depression", "acceptance"];

function shouldSkip(stageNum: number, skipStages: number[]): boolean {
  if (!skipStages.includes(stageNum)) return false;
  eugeneSay(`Skipping ${STAGE_NAMES[stageNum - 1]}. Grief counselors do not recommend this.`);
  return true;
}

export interface SigintController {
  /** The SIGINT listener to install on the process. */
  handler: () => void;
  /** Marks a skippable stage as running; returns a signal aborted on the next SIGINT. */
  beginSkippable(): AbortSignal;
  /** Marks the skippable stage as finished; SIGINT is blocked again. */
  endSkippable(): void;
}

export function createSigintController(): SigintController {
  let skippable: AbortController | null = null;

  return {
    handler: () => {
      print("");
      if (skippable) {
        skippable.abort();
        skippable = null;
        eugeneSay("Fine. We'll move on.");
      } else {
        eugeneSay("You can't interrupt grief. Only process it.");
      }
    },
    beginSkippable() {
      skippable = new AbortController();
      return skippable.signal;
    },
    endSkippable() {
      skippable = null;
    },
  };
}

export async function runStagesInteractive(
  errorOutput: string,
  opts: EugeneOptions,
): Promise<void> {
  const sigint = createSigintController();
  const sigintHandler = sigint.handler;

  process.on("SIGINT", sigintHandler);

  try {
    print("");

    if (!shouldSkip(1, opts.skipStages)) {
      await denial(errorOutput);
    }

    if (!shouldSkip(2, opts.skipStages)) {
      await anger(opts.angerRoom);
    }

    if (!shouldSkip(3, opts.skipStages)) {
      await bargaining(errorOutput);
    }

    if (!shouldSkip(4, opts.skipStages)) {
      const signal = sigint.beginSkippable();
      try {
        await depression(opts.speed, signal);
      } finally {
        sigint.endSkippable();
      }
    }

    if (!shouldSkip(5, opts.skipStages)) {
      await acceptance(opts.mantra!);
    }

    if (opts.hierarchical) {
      await blame();
    }

    print("");
  } finally {
    process.off("SIGINT", sigintHandler);
  }
}

export function runStagesNonInteractive(errorOutput: string, opts: EugeneOptions): void {
  print("");

  if (!shouldSkip(1, opts.skipStages)) denialNonInteractive(errorOutput);
  if (!shouldSkip(2, opts.skipStages)) angerNonInteractive();
  if (!shouldSkip(3, opts.skipStages)) bargainingNonInteractive(errorOutput);
  if (!shouldSkip(4, opts.skipStages)) depressionNonInteractive();
  if (!shouldSkip(5, opts.skipStages)) acceptanceNonInteractive(opts.mantra!);
  if (opts.hierarchical) blameNonInteractive();

  print("");
}
