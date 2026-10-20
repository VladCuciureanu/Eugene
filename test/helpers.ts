import { PassThrough, Writable } from "node:stream";
import { closeInput, type Io, io } from "../src/prompt.ts";

/** A writable that records everything written to it. */
export class Collector extends Writable {
  text = "";

  override _write(chunk: Buffer | string, _encoding: BufferEncoding, done: () => void): void {
    this.text += chunk.toString();
    done();
  }
}

/** Strips ANSI colour codes so assertions can match plain text. */
export function plain(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching ANSI escapes
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export interface Scripted {
  /** Feed more answers (each one becomes a line). */
  type(...answers: string[]): void;
  /** End the input, like Ctrl+D. */
  end(): void;
  /** Everything Eugene has said so far, without colours. */
  output(): string;
}

/**
 * Runs `fn` with Eugene's I/O redirected: `answers` are typed as input lines (the input
 * stays open unless `end` is set), output is captured, and `random` replaces Math.random.
 */
export async function withIo<T>(
  options: { answers?: string[]; end?: boolean; random?: () => number },
  fn: (scripted: Scripted) => Promise<T> | T,
): Promise<T> {
  const saved: Io = { ...io };
  const input = new PassThrough();
  const output = new Collector();
  const scripted: Scripted = {
    type: (...answers) => {
      for (const a of answers) input.write(`${a}\n`);
    },
    end: () => input.end(),
    output: () => plain(output.text),
  };
  io.input = input;
  io.output = output;
  io.random = options.random ?? (() => 0);
  scripted.type(...(options.answers ?? []));
  if (options.end) scripted.end();
  try {
    return await fn(scripted);
  } finally {
    closeInput();
    Object.assign(io, saved);
  }
}
