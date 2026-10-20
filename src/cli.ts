import util from "node:util";

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
  EUGENE_DISABLE=1   Run the command without the stages. For cowards.
  NO_EUGENE=1        Same, with a remark.`;

export function checkEnv(): "run" | "disable" | "disable-snark" {
  if (process.env.EUGENE_DISABLE === "1") return "disable";
  if (process.env.NO_EUGENE === "1") return "disable-snark";
  return "run";
}

const OPTIONS = {
  help: { type: "boolean", short: "h" },
  hierarchical: { type: "boolean" },
  speed: { type: "string" },
  mantra: { type: "string" },
  "skip-stage": { type: "string", multiple: true },
  "anger-room": { type: "boolean" },
} as const;

/** Quotes `text` for a POSIX shell, unless it is plainly safe as is. */
function shellQuote(text: string): string {
  return /^[\w@%+=:,./-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\\''")}'`;
}

/**
 * Finds the option whose separate value starts with "-", which strict parsing rejects as
 * ambiguous. Lenient parsing takes that value as the option's argument, so the token shows it.
 */
function ambiguousValue(args: string[]): string | undefined {
  const { tokens } = util.parseArgs({
    args,
    options: OPTIONS,
    strict: false,
    allowPositionals: true,
    tokens: true,
  });
  for (const t of tokens) {
    if (t.kind === "option-terminator") break;
    if (t.kind === "option" && !t.inlineValue && t.value?.startsWith("-")) {
      return `option '${t.rawName}' got '${t.value}', which looks like an option; write ${shellQuote(`${t.rawName}=${t.value}`)}`;
    }
  }
  return undefined;
}

/** Rewords node:util's parse errors as one short line. */
function usageError(err: unknown, args: string[]): UsageError {
  const { code, message } = err as NodeJS.ErrnoException;
  const unknown = /^Unknown option '([^']+)'/.exec(message);
  if (code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" && unknown) {
    return new UsageError(`unknown option '${unknown[1]}'`);
  }
  const missing = /^Option '(--[\w-]+)[^']*' argument missing/.exec(message);
  if (code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" && missing) {
    return new UsageError(`${missing[1]} requires a value.`);
  }
  if (code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" && /argument is ambiguous/.test(message)) {
    const ambiguous = ambiguousValue(args);
    if (ambiguous) return new UsageError(ambiguous);
  }
  if (code?.startsWith("ERR_PARSE_ARGS_")) {
    // Anything else: node's first line only, without the stray ".." some messages end with.
    const first = (message.split("\n")[0] ?? "").trim().replace(/\.{2,}$/, ".");
    return new UsageError(first);
  }
  throw err;
}

function parse(args: string[]) {
  try {
    return util.parseArgs({
      args,
      options: OPTIONS,
      strict: true,
      allowPositionals: true,
      tokens: true,
    });
  } catch (err) {
    throw usageError(err, args);
  }
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

  // Asking for help wins over any other mistake on the command line.
  const end = args.indexOf("--");
  const own = end === -1 ? args : args.slice(0, end);
  if (own.includes("-h") || own.includes("--help")) {
    opts.help = true;
    return opts;
  }

  const { values, tokens } = parse(args);

  // Everything after "--" is the command; anything else positional is a mistake.
  const terminator = tokens.find((t) => t.kind === "option-terminator");
  const stray = tokens.find(
    (t) => t.kind === "positional" && (!terminator || t.index < terminator.index),
  );
  if (stray?.kind === "positional") {
    throw new UsageError(`unexpected argument '${stray.value}'. Put the command after '--'.`);
  }
  if (terminator) opts.command = args.slice(terminator.index + 1);

  const { speed, mantra } = values;
  if (speed !== undefined) {
    if (speed !== "slow" && speed !== "fast" && speed !== "instant") {
      throw new UsageError(`invalid speed '${speed}'. Use slow, fast, or instant.`);
    }
    opts.speed = speed;
  }
  if (mantra !== undefined) {
    if (!mantra) throw new UsageError("--mantra requires a value.");
    opts.mantra = mantra;
  }
  for (const stage of values["skip-stage"] ?? []) {
    if (!/^[1-5]$/.test(stage)) throw new UsageError("--skip-stage requires a number 1-5.");
    opts.skipStages.push(Number(stage));
  }
  opts.hierarchical = values.hierarchical ?? false;
  opts.angerRoom = values["anger-room"] ?? false;

  if (opts.command.length === 0) {
    // Nothing to run and nothing piped in: the user needs the usage text.
    if (process.stdin.isTTY) opts.help = true;
    else opts.pipeMode = true;
  }

  return opts;
}
