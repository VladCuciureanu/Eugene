import type { Speed } from "./cli.ts";

// ANSI color helpers
const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const CYAN = `${ESC}36m`;
const DIM = `${ESC}2m`;
const YELLOW = `${ESC}33m`;
const RED = `${ESC}31m`;
const BOLD = `${ESC}1m`;

export const style = {
  eugene: (s: string) => `${CYAN}Eugene:${RESET} ${s}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  warm: (s: string) => `${YELLOW}${s}${RESET}`,
  error: (s: string) => `${RED}${s}${RESET}`,
  bold: (s: string) => `${BOLD}${s}${RESET}`,
};

export function print(msg: string) {
  process.stderr.write(msg + "\n");
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

export function delay(ms: number, speed: Speed): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms * SPEED_MULTIPLIER[speed]));
}

export async function timedPrint(msg: string, pauseMs: number, speed: Speed) {
  await delay(pauseMs, speed);
  eugeneDim(msg);
}

const decoder = new TextDecoder();

export function prompt(prefix = "> "): Promise<string> {
  process.stderr.write(style.dim(prefix));

  const stdin = process.stdin;
  if (stdin.readableEnded) return Promise.resolve("");
  return new Promise((resolve) => {
    const finish = (text: string) => {
      stdin.off("data", onData);
      stdin.off("end", onEnd);
      stdin.pause();
      resolve(text);
    };
    const onData = (chunk: Buffer) => finish(decoder.decode(chunk).trim());
    const onEnd = () => finish("");
    stdin.on("data", onData);
    stdin.once("end", onEnd);
    stdin.resume();
  });
}
