import { spawn } from "node:child_process";
import os from "node:os";
import type { Readable } from "node:stream";

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** A reader closed our stdout or stderr early (`eugene -- cmd | head`), so forwarding stopped. */
  brokenPipe: boolean;
}

export interface RunOptions {
  /** Receives the child's stdout as it arrives (default: process.stdout). */
  stdout?: NodeJS.WritableStream;
  /** Receives the child's stderr as it arrives (default: process.stderr). */
  stderr?: NodeJS.WritableStream;
}

/**
 * Runs `command`, streaming its output live to `options.stdout` / `options.stderr`
 * while also capturing a copy for analysis once it exits.
 */
export function runCommand(command: string[], options: RunOptions = {}): Promise<RunResult> {
  const { stdout: outSink = process.stdout, stderr: errSink = process.stderr } = options;
  const [cmd, ...args] = command;
  const proc = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"] });

  let brokenPipe = false;
  /** Copies `source` to `sink` while keeping every chunk. Returns a function that detaches it. */
  const forward = (source: Readable, sink: NodeJS.WritableStream, chunks: Buffer[]) => {
    let open = true;
    const onError = (err: unknown) => {
      if (!isBrokenPipe(err)) throw err;
      open = false;
      brokenPipe = true;
      // As in a shell pipeline, the command's own writes now fail too, so it stops instead of
      // running on with nobody reading.
      source.destroy();
    };
    sink.on("error", onError);
    source.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      if (open) sink.write(chunk);
    });
    return () => sink.off("error", onError);
  };

  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  const detach = [forward(proc.stdout, outSink, stdout), forward(proc.stderr, errSink, stderr)];

  return new Promise((resolve, reject) => {
    proc.once("error", (err) => {
      for (const d of detach) d();
      reject(err);
    });
    proc.once("close", (code, signal) => {
      for (const d of detach) d();
      const decoder = new TextDecoder();
      resolve({
        exitCode: code ?? 128 + (signal ? os.constants.signals[signal] : 0),
        stdout: decoder.decode(Buffer.concat(stdout)),
        stderr: decoder.decode(Buffer.concat(stderr)),
        brokenPipe,
      });
    });
  });
}

/** True for the error a write gets once its reader has gone away. */
export function isBrokenPipe(err: unknown): boolean {
  return (err as NodeJS.ErrnoException | undefined)?.code === "EPIPE";
}

/**
 * Turns a failure to start `command` into a user-facing message and exit code
 * (127 for "not found", 126 for "not executable", like a shell).
 */
export function describeSpawnError(
  command: string[],
  err: unknown,
): { message: string; exitCode: number } {
  const cmd = command[0];
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  let problem: string;
  let exitCode = 126;
  if (code === "ENOENT") {
    problem = `command not found: ${cmd}`;
    exitCode = 127;
  } else if (code === "EACCES") {
    problem = `permission denied: ${cmd}`;
  } else {
    problem = `failed to run ${cmd}: ${err instanceof Error ? err.message : String(err)}`;
  }
  return {
    message: `eugene: ${problem}
Run 'eugene --help' for usage.`,
    exitCode,
  };
}

export async function readPipeInput(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(decoder.decode(chunk, { stream: true }));
  }
  // Flush: an incomplete character at the very end becomes U+FFFD instead of vanishing.
  chunks.push(decoder.decode());

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
