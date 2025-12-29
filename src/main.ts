import { parseArgs, checkEnv } from "./cli.ts";
import { runCommand, readPipeInput, looksLikeError } from "./runner.ts";
import { runStagesInteractive, runStagesNonInteractive } from "./stages/mod.ts";
import { eugeneSay, print } from "./prompt.ts";

async function main() {
  const envCheck = checkEnv();
  if (envCheck === "disable") Deno.exit(0);
  if (envCheck === "disable-snark") {
    eugeneSay("Avoiding your emotions, I see.");
    Deno.exit(0);
  }

  const opts = parseArgs(Deno.args);
  const isInteractive = Deno.stdin.isTerminal();

  if (opts.pipeMode) {
    const input = await readPipeInput();

    if (!looksLikeError(input)) {
      Deno.stdout.writeSync(new TextEncoder().encode(input));
      Deno.exit(0);
    }

    if (isInteractive) {
      await runStagesInteractive(input, opts);
    } else {
      runStagesNonInteractive(input, opts);
    }

    Deno.stdout.writeSync(new TextEncoder().encode(input));
    Deno.exit(1);
  }

  const result = await runCommand(opts.command);

  if (result.stdout) {
    Deno.stdout.writeSync(new TextEncoder().encode(result.stdout));
  }
  if (result.stderr) {
    Deno.stderr.writeSync(new TextEncoder().encode(result.stderr));
  }

  if (result.exitCode === 0) {
    Deno.exit(0);
  }

  const errorOutput = result.stderr || result.stdout;

  if (isInteractive) {
    await runStagesInteractive(errorOutput, opts);
  } else {
    runStagesNonInteractive(errorOutput, opts);
  }

  Deno.exit(result.exitCode);
}

if (import.meta.main) {
  main();
}
