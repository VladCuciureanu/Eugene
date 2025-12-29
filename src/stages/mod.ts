import type { EugeneOptions } from "../cli.ts";
import { eugeneSay, print } from "../prompt.ts";
import { denial, denialNonInteractive } from "./denial.ts";
import { anger, angerNonInteractive } from "./anger.ts";
import { bargaining, bargainingNonInteractive } from "./bargaining.ts";
import { depression, depressionNonInteractive } from "./depression.ts";
import { acceptance, acceptanceNonInteractive } from "./acceptance.ts";
import { blame, blameNonInteractive } from "./blame.ts";

const STAGE_NAMES = ["denial", "anger", "bargaining", "depression", "acceptance"];

function shouldSkip(stageNum: number, skipStages: number[]): boolean {
  if (!skipStages.includes(stageNum)) return false;
  eugeneSay(
    `Skipping ${STAGE_NAMES[stageNum - 1]}. Grief counselors do not recommend this.`
  );
  return true;
}

export async function runStagesInteractive(
  errorOutput: string,
  opts: EugeneOptions
): Promise<void> {
  let sigintBlocked = true;

  const sigintHandler = () => {
    if (sigintBlocked) {
      print("");
      eugeneSay("You can't interrupt grief. Only process it.");
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
  opts: EugeneOptions
): void {
  print("");

  if (!shouldSkip(1, opts.skipStages)) denialNonInteractive(errorOutput);
  if (!shouldSkip(2, opts.skipStages)) angerNonInteractive();
  if (!shouldSkip(3, opts.skipStages)) bargainingNonInteractive(errorOutput);
  if (!shouldSkip(4, opts.skipStages)) depressionNonInteractive();
  if (!shouldSkip(5, opts.skipStages)) acceptanceNonInteractive(opts.mantra!);
  if (opts.hierarchical) blameNonInteractive();

  print("");
}
