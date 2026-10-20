#!/usr/bin/env node
import { checkEnv, parseArgs } from "./cli.ts";
import { eugeneSay } from "./prompt.ts";
import {
  describeSpawnError,
  looksLikeError,
  type RunResult,
  readPipeInput,
  runCommand,
} from "./runner.ts";
import { runStagesInteractive, runStagesNonInteractive } from "./stages/mod.ts";

async function main() {
  const envCheck = checkEnv();
  if (envCheck === "disable") process.exit(0);
  if (envCheck === "disable-snark") {
    eugeneSay("Avoiding your emotions, I see.");
    process.exitCode = 0;
    return;
  }

  const opts = parseArgs(process.argv.slice(2));
  const isInteractive = Boolean(process.stdin.isTTY);

  if (opts.pipeMode) {
    const input = await readPipeInput();

    if (!looksLikeError(input)) {
      process.stdout.write(input);
      process.exitCode = 0;
      return;
    }

    if (isInteractive) {
      await runStagesInteractive(input, opts);
    } else {
      runStagesNonInteractive(input, opts);
    }

    process.stdout.write(input);
    process.exitCode = 1;
    return;
  }

  let result: RunResult;
  try {
    result = await runCommand(opts.command);
  } catch (err) {
    const { message, exitCode } = describeSpawnError(opts.command, err);
    console.error(message);
    process.exitCode = exitCode;
    return;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.exitCode === 0) {
    process.exitCode = 0;
    return;
  }

  const errorOutput = result.stderr || result.stdout;

  if (isInteractive) {
    await runStagesInteractive(errorOutput, opts);
  } else {
    runStagesNonInteractive(errorOutput, opts);
  }

  process.exitCode = result.exitCode;
}

if (import.meta.main) {
  main();
}
