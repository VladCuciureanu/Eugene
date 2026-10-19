import { spawn } from "node:child_process";
import os from "node:os";

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function runCommand(command: string[]): Promise<RunResult> {
  const [cmd, ...args] = command;
  const proc = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"] });

  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  proc.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
  proc.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

  return new Promise((resolve, reject) => {
    proc.once("error", reject);
    proc.once("close", (code, signal) => {
      const decoder = new TextDecoder();
      resolve({
        exitCode: code ?? 128 + (signal ? os.constants.signals[signal] : 0),
        stdout: decoder.decode(Buffer.concat(stdout)),
        stderr: decoder.decode(Buffer.concat(stderr)),
      });
    });
  });
}

export async function readPipeInput(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(decoder.decode(chunk, { stream: true }));
  }

  return chunks.join("");
}

const ERROR_PATTERNS = [
  /error/i,
  /failed/i,
  /fatal/i,
  /exception/i,
  /panic/i,
  /traceback/i,
  /abort/i,
  /segfault/i,
  /ENOENT/,
  /EACCES/,
  /denied/i,
  /not found/i,
  /cannot find/i,
  /no such file/i,
  /undefined reference/i,
  /compilation failed/i,
];

export function looksLikeError(text: string): boolean {
  return ERROR_PATTERNS.some((pattern) => pattern.test(text));
}
