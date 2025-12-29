export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCommand(command: string[]): Promise<RunResult> {
  const [cmd, ...args] = command;
  const proc = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const output = await proc.output();
  const decoder = new TextDecoder();

  return {
    exitCode: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

export async function readPipeInput(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  const reader = Deno.stdin.readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
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
