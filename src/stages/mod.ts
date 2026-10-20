import type { EugeneOptions } from "../cli.ts";
import { closeInput, eugeneSay, print } from "../prompt.ts";
import { acceptance, acceptanceNonInteractive } from "./acceptance.ts";
import { anger, angerNonInteractive } from "./anger.ts";
import { bargaining, bargainingNonInteractive } from "./bargaining.ts";
import { blame, blameNonInteractive } from "./blame.ts";
import { denial, denialNonInteractive } from "./denial.ts";
import { depression, depressionNonInteractive } from "./depression.ts";

interface StageContext {
  errorOutput: string;
  opts: EugeneOptions;
  /** Aborted when the user presses Ctrl+C during a stage that allows it. */
  signal?: AbortSignal;
}

interface Stage {
  name: string;
  /** Whether Ctrl+C skips the rest of this stage (otherwise it is refused). */
  ctrlCSkips?: boolean;
  interactive(ctx: StageContext): Promise<void>;
  nonInteractive(ctx: StageContext): void;
}

/** The five stages, in order. `--skip-stage n` refers to their position here. */
const STAGES: Stage[] = [
  {
    name: "denial",
    interactive: ({ errorOutput }) => denial(errorOutput),
    nonInteractive: ({ errorOutput }) => denialNonInteractive(errorOutput),
  },
  {
    name: "anger",
    interactive: ({ opts }) => anger(opts.angerRoom),
    nonInteractive: () => angerNonInteractive(),
  },
  {
    name: "bargaining",
    interactive: ({ errorOutput }) => bargaining(errorOutput),
    nonInteractive: ({ errorOutput }) => bargainingNonInteractive(errorOutput),
  },
  {
    name: "depression",
    ctrlCSkips: true,
    interactive: ({ opts, signal }) => depression(opts.speed, signal),
    nonInteractive: () => depressionNonInteractive(),
  },
  {
    name: "acceptance",
    interactive: ({ opts }) => acceptance(opts.mantra),
    nonInteractive: ({ opts }) => acceptanceNonInteractive(opts.mantra),
  },
];

/** The bonus sixth stage for `--hierarchical`. It cannot be skipped. */
const BLAME: Stage = {
  name: "blame",
  interactive: () => blame(),
  nonInteractive: () => blameNonInteractive(),
};

/** Yields the stages to run, announcing skipped ones as they come up. */
function* stagesToRun(opts: EugeneOptions): Generator<Stage> {
  for (const [index, stage] of STAGES.entries()) {
    if (opts.skipStages.includes(index + 1)) {
      eugeneSay(`Skipping ${stage.name}. Grief counselors do not recommend this.`);
      continue;
    }
    yield stage;
  }
  if (opts.hierarchical) yield BLAME;
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

    for (const stage of stagesToRun(opts)) {
      if (!stage.ctrlCSkips) {
        await stage.interactive({ errorOutput, opts });
        continue;
      }
      const signal = sigint.beginSkippable();
      try {
        await stage.interactive({ errorOutput, opts, signal });
      } finally {
        sigint.endSkippable();
      }
    }

    print("");
  } finally {
    process.off("SIGINT", sigintHandler);
    closeInput();
  }
}

export function runStagesNonInteractive(errorOutput: string, opts: EugeneOptions): void {
  print("");

  for (const stage of stagesToRun(opts)) {
    stage.nonInteractive({ errorOutput, opts });
  }

  print("");
}
