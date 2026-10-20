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
 * While the wrapped command runs, runCommand handles a broken pipe itself, because the exit
 * code has to wait for the command to finish.
 */
let commandRunning = false;

/**
 * A reader closed stdout or stderr early (`eugene ... | head`): stop quietly, keeping the
 * exit code decided so far (the command's, or 1 for Eugene's own errors and found errors).
 */
function quitOnBrokenPipe(err: unknown) {
  if (!isBrokenPipe(err)) throw err;
  if (!commandRunning) process.exit(process.exitCode ?? 0);
}

async function main() {
  let opts: EugeneOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    process.exitCode = 1;
    console.error(`eugene: ${err.message}`);
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

    // Set now, so that a reader leaving early during the stages still gets the verdict.
    process.exitCode = 1;

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
    return;
  }

  let result: RunResult;
  commandRunning = true;
  try {
    result = await runCommand(opts.command);
  } catch (err) {
    const { message, exitCode } = describeSpawnError(opts.command, err);
    process.exitCode = exitCode;
    console.error(message);
    return;
  } finally {
    commandRunning = false;
  }
  process.exitCode = result.exitCode;

  // The command's output was already streamed live by runCommand. If nobody is reading
  // any more, there is no one to grieve with either.
  if (result.exitCode === 0 || !grieve || result.brokenPipe) return;

  const errorOutput = result.stderr || result.stdout;

  if (canPromptOnStdio()) {
    await runStagesInteractive(errorOutput, opts);
  } else {
    runStagesNonInteractive(errorOutput, opts);
  }
}

if (import.meta.main) {
  process.stdout.on("error", quitOnBrokenPipe);
  process.stderr.on("error", quitOnBrokenPipe);
  main().catch((err: unknown) => {
    // Unexpected failures get one line, like every other error, rather than a stack trace.
    process.exitCode = 1;
    console.error(`eugene: ${err instanceof Error ? err.message : String(err)}`);
  });
}
