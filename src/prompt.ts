import fs from "node:fs";
import readline from "node:readline";
import tty from "node:tty";
import type { Speed } from "./cli.ts";

// ANSI color helpers
const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const CYAN = `${ESC}36m`;
const DIM = `${ESC}2m`;
const YELLOW = `${ESC}33m`;

export const style = {
  eugene: (s: string) => `${CYAN}Eugene:${RESET} ${s}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  warm: (s: string) => `${YELLOW}${s}${RESET}`,
};

export interface Io {
  /** Where answers to prompts are read from, one line per answer. */
  input: NodeJS.ReadableStream;
  /** Where Eugene talks (stderr, so it never mixes with the command's stdout). */
  output: NodeJS.WritableStream;
  /** Source of randomness, e.g. for shuffling suggestions. Returns [0, 1). */
  random: () => number;
}

/** Eugene's I/O. Replace fields to redirect it (tests, or a terminal opened for pipe mode). */
export const io: Io = {
  input: process.stdin,
  output: process.stderr,
  random: Math.random,
};

export function print(msg: string) {
  io.output.write(`${msg}\n`);
}

export function eugeneSay(msg: string) {
  print(style.eugene(msg));
}

export function eugeneDim(msg: string) {
  print(style.eugene(style.dim(msg)));
}

export function eugeneWarm(msg: string) {
  print(style.eugene(style.warm(msg)));
}

const SPEED_MULTIPLIER: Record<Speed, number> = {
  slow: 1,
  fast: 0.3,
  instant: 0.05,
};

export function delay(ms: number, speed: Speed, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms * SPEED_MULTIPLIER[speed]);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function timedPrint(msg: string, pauseMs: number, speed: Speed, signal?: AbortSignal) {
  await delay(pauseMs, speed, signal);
  if (signal?.aborted) return;
  eugeneDim(msg);
}

/** Reads answers one line at a time, queueing lines that arrive before they are asked for. */
class LineReader {
  readonly input: NodeJS.ReadableStream;
  private readonly rl: readline.Interface;
  private readonly lines: string[] = [];
  private readonly waiters: ((line: string | null) => void)[] = [];
  private ended = false;

  constructor(input: NodeJS.ReadableStream) {
    this.input = input;
    this.rl = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });
    this.rl.on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter) waiter(line);
      else this.lines.push(line);
    });
    this.rl.on("close", () => {
      this.ended = true;
      for (const waiter of this.waiters.splice(0)) waiter(null);
    });
  }

  /** The next line, or null once the input has ended. */
  next(): Promise<string | null> {
    const line = this.lines.shift();
    if (line !== undefined) return Promise.resolve(line);
    if (this.ended) return Promise.resolve(null);
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  get exhausted(): boolean {
    return this.ended && this.lines.length === 0;
  }

  close(): void {
    this.rl.close();
  }
}

let reader: LineReader | null = null;

function currentReader(): LineReader {
  if (reader?.input !== io.input) {
    reader?.close();
    reader = new LineReader(io.input);
  }
  return reader;
}

/** Asks for one line of input. Resolves to "" once the input has ended. */
export async function prompt(prefix = "> "): Promise<string> {
  io.output.write(style.dim(prefix));
  const line = await currentReader().next();
  return line?.trim() ?? "";
}

/** True once the input has ended and every line has been read; further prompts return "". */
export function inputEnded(): boolean {
  return currentReader().exhausted;
}

/**
 * Whether Eugene can ask questions when wrapping a command: answers are read from stdin and
 * the questions are written to stderr, so both have to be the terminal.
 */
export function canPromptOnStdio(): boolean {
  return Boolean(process.stdin.isTTY && process.stderr.isTTY);
}

const TERMINAL_PATH = process.platform === "win32" ? "\\\\.\\CONIN$" : "/dev/tty";

/**
 * Opens the controlling terminal for reading, bypassing stdin (which in pipe mode is the
 * piped-in output). Returns null when there is no terminal, e.g. in CI or under cron.
 */
export function openTerminalInput(path = TERMINAL_PATH): tty.ReadStream | null {
  let fd: number;
  try {
    fd = fs.openSync(path, "r");
  } catch {
    return null;
  }
  if (!tty.isatty(fd)) {
    fs.closeSync(fd);
    return null;
  }
  return new tty.ReadStream(fd);
}

/** Stops reading from the current input so the process can exit. */
export function closeInput(): void {
  reader?.close();
  reader = null;
}
