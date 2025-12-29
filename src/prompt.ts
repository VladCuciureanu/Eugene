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
  Deno.stderr.writeSync(new TextEncoder().encode(msg + "\n"));
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
const encoder = new TextEncoder();

export async function prompt(prefix = "> "): Promise<string> {
  Deno.stderr.writeSync(encoder.encode(style.dim(prefix)));

  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  if (n === null) return "";
  return decoder.decode(buf.subarray(0, n)).trim();
}
