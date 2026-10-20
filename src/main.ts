#!/usr/bin/env node
import { checkEnv, type EugeneOptions, parseArgs, USAGE, UsageError } from "./cli.ts";
import { canPromptOnStdio, eugeneSay, io, openTerminalInput } from "./prompt.ts";
import {
  describeSpawnError,
  isBrokenPipe,
  looksLikeError,
  type RunResult,
  readPipeInput,
  runCommand,
} from "./runner.ts";
import { runStagesInteractive, runStagesNonInteractive } from "./stages/mod.ts";

/**
 * What to exit with when a reader closes stdout or stderr early (`eugene ... | head`):
 * 0 until the wrapped command has finished, then its exit code. `null` while the command
 * runs, because runCommand handles that itself and waits for the command's exit code.
 */
let brokenPipeStatus: number | null = 0;

function quitOnBrokenPipe(err: unknown) {
  if (!isBrokenPipe(err)) throw err;
  if (brokenPipeStatus !== null) process.exit(brokenPipeStatus);
}

async function main() {
  let opts: EugeneOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    console.error(`eugene: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  if (opts.help) {
    console.log(USAGE);
    return;
  }

  // Disabled, Eugene still runs the command (or passes the pipe on), just without the grief.
  const envCheck = checkEnv();
  if (envCheck === "disable-snark") eugeneSay("Avoiding your emotions, I see.");
  const grieve = envCheck === "run";

  if (opts.pipeMode) {
    const input = await readPipeInput();

    if (!grieve || !looksLikeError(input)) {
      process.stdout.write(input);
      process.exitCode = 0;
      return;
    }

    // stdin is the pipe we just drained, so answers have to come from the terminal itself.
    // Only ask when Eugene's questions (on stderr) can actually be seen there.
    const terminal = process.stderr.isTTY ? openTerminalInput() : null;
    if (terminal) {
      io.input = terminal;
      try {
        await runStagesInteractive(input, opts);
      } finally {
        terminal.destroy();
      }
    } else {
      runStagesNonInteractive(input, opts);
    }

    process.stdout.write(input);
    process.exitCode = 1;
    return;
  }

  let result: RunResult;
  brokenPipeStatus = null;
  try {
    result = await runCommand(opts.command);
  } catch (err) {
    const { message, exitCode } = describeSpawnError(opts.command, err);
    brokenPipeStatus = exitCode;
    console.error(message);
    process.exitCode = exitCode;
    return;
  }
  brokenPipeStatus = result.exitCode;

  // The command's output was already streamed live by runCommand. If nobody is reading
  // any more, there is no one to grieve with either.
  if (result.exitCode === 0 || !grieve || result.brokenPipe) {
    process.exitCode = result.exitCode;
    return;
  }

  const errorOutput = result.stderr || result.stdout;

  if (canPromptOnStdio()) {
    await runStagesInteractive(errorOutput, opts);
  } else {
    runStagesNonInteractive(errorOutput, opts);
  }

  process.exitCode = result.exitCode;
}

if (import.meta.main) {
  process.stdout.on("error", quitOnBrokenPipe);
  process.stderr.on("error", quitOnBrokenPipe);
  main().catch((err: unknown) => {
    // Unexpected failures get one line, like every other error, rather than a stack trace.
    console.error(`eugene: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}
