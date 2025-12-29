export type Speed = "slow" | "fast" | "instant";

export interface GriefOptions {
  command: string[];
  hierarchical: boolean;
  speed: Speed;
  mantra: string | null;
  skipStages: number[];
  angerRoom: boolean;
  pipeMode: boolean;
}

const DEFAULT_MANTRA = "The failure was not personal.";

function printUsage(): never {
  console.log(`grief — process your failed commands through the 5 stages

Usage:
  grief [options] -- <command> [args...]
  some-command 2>&1 | grief

Options:
  --hierarchical     Enable blame stage (manager mode)
  --speed <mode>     slow (default), fast, instant
  --mantra <text>    Custom affirmation for acceptance stage
  --skip-stage <n>   Skip a stage (1-5). Not recommended.
  --anger-room       Extend anger stage indefinitely
  -h, --help         Show this help

Environment:
  GRIEF_DISABLE=1    Disable grief entirely. For cowards.
  NO_GRIEF=1         Alias for GRIEF_DISABLE.`);
  Deno.exit(0);
}

export function checkEnv(): "run" | "disable" | "disable-snark" {
  if (Deno.env.get("GRIEF_DISABLE") === "1") return "disable";
  if (Deno.env.get("NO_GRIEF") === "1") return "disable-snark";
  return "run";
}

export function parseArgs(args: string[]): GriefOptions {
  const opts: GriefOptions = {
    command: [],
    hierarchical: false,
    speed: "slow",
    mantra: null,
    skipStages: [],
    angerRoom: false,
    pipeMode: false,
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
        printUsage();
        break;
      case "--hierarchical":
        opts.hierarchical = true;
        break;
      case "--speed": {
        i++;
        const val = args[i];
        if (val !== "slow" && val !== "fast" && val !== "instant") {
          console.error(`grief: invalid speed '${val}'. Use slow, fast, or instant.`);
          Deno.exit(1);
        }
        opts.speed = val;
        break;
      }
      case "--mantra":
        i++;
        opts.mantra = args[i];
        if (!opts.mantra) {
          console.error("grief: --mantra requires a value.");
          Deno.exit(1);
        }
        break;
      case "--skip-stage": {
        i++;
        const n = parseInt(args[i]);
        if (isNaN(n) || n < 1 || n > 5) {
          console.error("grief: --skip-stage requires a number 1-5.");
          Deno.exit(1);
        }
        opts.skipStages.push(n);
        break;
      }
      case "--anger-room":
        opts.angerRoom = true;
        break;
      default:
        console.error(`grief: unknown option '${arg}'`);
        Deno.exit(1);
    }
    i++;
  }

  if (opts.command.length === 0 && Deno.stdin.isTerminal()) {
    printUsage();
  }

  if (opts.command.length === 0) {
    opts.pipeMode = true;
  }

  if (!opts.mantra) {
    opts.mantra = DEFAULT_MANTRA;
  }

  return opts;
}
