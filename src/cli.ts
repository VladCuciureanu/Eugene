export type Speed = "slow" | "fast" | "instant";

export interface EugeneOptions {
  command: string[];
  hierarchical: boolean;
  speed: Speed;
  mantra: string;
  skipStages: number[];
  angerRoom: boolean;
  pipeMode: boolean;
  /** Show usage and exit successfully instead of running anything. */
  help: boolean;
}

/** Bad command-line arguments. The message is meant for the user, without a stack trace. */
export class UsageError extends Error {
  override name = "UsageError";
}

const DEFAULT_MANTRA = "The failure was not personal.";

export const USAGE = `eugene — process your failed commands through the 5 stages

Usage:
  eugene [options] -- <command> [args...]
  some-command 2>&1 | eugene

Options:
  --hierarchical     Enable blame stage (manager mode)
  --speed <mode>     slow (default), fast, instant
  --mantra <text>    Custom affirmation for acceptance stage
  --skip-stage <n>   Skip a stage (1-5). Not recommended.
  --anger-room       Extend anger stage indefinitely
  -h, --help         Show this help

Environment:
  EUGENE_DISABLE=1   Disable Eugene entirely. For cowards.
  NO_EUGENE=1        Alias for EUGENE_DISABLE.`;

export function checkEnv(): "run" | "disable" | "disable-snark" {
  if (process.env.EUGENE_DISABLE === "1") return "disable";
  if (process.env.NO_EUGENE === "1") return "disable-snark";
  return "run";
}

/** Parses Eugene's arguments. Throws UsageError for invalid ones; never exits the process. */
export function parseArgs(args: string[]): EugeneOptions {
  const opts: EugeneOptions = {
    command: [],
    hierarchical: false,
    speed: "slow",
    mantra: DEFAULT_MANTRA,
    skipStages: [],
    angerRoom: false,
    pipeMode: false,
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--") {
      opts.command = args.slice(i + 1);
      break;
    }

    switch (arg) {
      case "-h":
      case "--help":
        opts.help = true;
        return opts;
      case "--hierarchical":
        opts.hierarchical = true;
        break;
      case "--speed": {
        i++;
        const val = args[i];
        if (val === undefined) throw new UsageError("--speed requires a value.");
        if (val !== "slow" && val !== "fast" && val !== "instant") {
          throw new UsageError(`invalid speed '${val}'. Use slow, fast, or instant.`);
        }
        opts.speed = val;
        break;
      }
      case "--mantra":
        i++;
        if (!args[i]) throw new UsageError("--mantra requires a value.");
        opts.mantra = args[i];
        break;
      case "--skip-stage": {
        i++;
        const val = args[i];
        if (!/^[1-5]$/.test(val ?? "")) {
          throw new UsageError("--skip-stage requires a number 1-5.");
        }
        opts.skipStages.push(Number(val));
        break;
      }
      case "--anger-room":
        opts.angerRoom = true;
        break;
      default:
        throw new UsageError(`unknown option '${arg}'`);
    }
    i++;
  }

  if (opts.command.length === 0) {
    // Nothing to run and nothing piped in: the user needs the usage text.
    if (process.stdin.isTTY) opts.help = true;
    else opts.pipeMode = true;
  }

  return opts;
}
