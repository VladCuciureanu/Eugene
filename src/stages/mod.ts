import type { GriefOptions } from "../cli.ts";
import { griefSay, print } from "../prompt.ts";
import { denial, denialNonInteractive } from "./denial.ts";
import { anger, angerNonInteractive } from "./anger.ts";
import { bargaining, bargainingNonInteractive } from "./bargaining.ts";
import { depression, depressionNonInteractive } from "./depression.ts";
import { acceptance, acceptanceNonInteractive } from "./acceptance.ts";
import { blame, blameNonInteractive } from "./blame.ts";

const STAGE_NAMES = ["denial", "anger", "bargaining", "depression", "acceptance"];

function shouldSkip(stageNum: number, skipStages: number[]): boolean {
  if (!skipStages.includes(stageNum)) return false;
  griefSay(
    `Skipping ${STAGE_NAMES[stageNum - 1]}. Grief counselors do not recommend this.`
  );
  return true;
}

export async function runStagesInteractive(
  errorOutput: string,
  opts: GriefOptions
): Promise<void> {
  let sigintBlocked = true;

  const sigintHandler = () => {
    if (sigintBlocked) {
      print("");
      griefSay("You can't interrupt grief. Only process it.");
    }
  };

  Deno.addSignalListener("SIGINT", sigintHandler);

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
      sigintBlocked = false;
      await depression(opts.speed);
      sigintBlocked = true;
    }

    if (!shouldSkip(5, opts.skipStages)) {
      await acceptance(opts.mantra!);
    }

    if (opts.hierarchical) {
      await blame();
    }

    print("");
  } finally {
    Deno.removeSignalListener("SIGINT", sigintHandler);
  }
}

export function runStagesNonInteractive(
  errorOutput: string,
  opts: GriefOptions
): void {
  print("");

  if (!opts.skipStages.includes(1)) denialNonInteractive(errorOutput);
  if (!opts.skipStages.includes(2)) angerNonInteractive();
  if (!opts.skipStages.includes(3)) bargainingNonInteractive(errorOutput);
  if (!opts.skipStages.includes(4)) depressionNonInteractive();
  if (!opts.skipStages.includes(5)) acceptanceNonInteractive(opts.mantra!);
  if (opts.hierarchical) blameNonInteractive();

  print("");
}
