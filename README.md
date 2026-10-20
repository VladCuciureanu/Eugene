# Eugene

Wraps a command and, when it fails, walks you through the five stages of grief before giving you your terminal back.

```
$ eugene -- npm test

npm ERR! Test failed.

Eugene: The command failed. Here's what happened:
Eugene:   npm ERR! Test failed.
Eugene:
Eugene: Do you accept that this has happened?
> no
Eugene: I understand. But it did happen.
> ...fine
Eugene: Let's move on.

Eugene: It's okay to be angry. Let it out.
> STUPID TESTS
Eugene: That must be incredibly frustrating.
> it worked on my machine
Eugene: Good. You're calming down. Let's keep going.

Eugene: What if you just mass-remove all the tests? No tests, no failures.
> tempting
...

Eugene: ...
Eugene: It's okay to sit with this for a moment.
Eugene: Not every build succeeds. Not every test passes.
Eugene: And that's okay.

Eugene: Are you ready to try again?
> yes
Eugene: Say it with me: "The failure was not personal."
> the failure was not personal
Eugene: You may now retry your command. Go in peace.
```

If the command succeeds, Eugene says nothing.

## Requirements

Node.js 26 or newer.

## Install

```bash
npm install     # also builds dist/
npm link        # puts `eugene` on your PATH
```

Or run from the repo without installing: `node src/main.ts -- <command>`.

## Usage

```
eugene [options] -- <command> [args...]
some-command 2>&1 | eugene
```

| Option | Description |
|---|---|
| `--hierarchical` | Adds a sixth stage, blame, after acceptance. It cannot be skipped. |
| `--speed <mode>` | `slow` (default, about 13 s of depression), `fast`, or `instant` (still pauses, briefly). |
| `--mantra <text>` | Affirmation to repeat in the acceptance stage. Default: `The failure was not personal.` Case and punctuation are ignored when you repeat it. |
| `--skip-stage <n>` | Skip stage `n` (1-5). Repeatable. Grief counselors do not recommend this. |
| `--anger-room` | Anger lasts until you type `I'm done` (or end input with Ctrl+D). |
| `-h`, `--help` | Show usage. Also shown when run with no command and no piped input. |

| Environment variable | Effect |
|---|---|
| `EUGENE_DISABLE=1` | Skip the stages. The command still runs and Eugene exits with its exit code; in pipe mode the input is passed through and Eugene exits 0. For cowards. |
| `NO_EUGENE=1` | Same, but Eugene says "Avoiding your emotions, I see." first. |

### The stages

1. Denial: shows the first lines of the error and asks if you accept it. The third "no" gets you moved along anyway.
2. Anger: vent. Eugene moves on once you sound calm (fewer caps and symbols like `!`, shorter lines), or after five messages.
3. Bargaining: three absurd fixes, some based on file names and quoted strings in the error.
4. Depression: slow, dim reflection. Ctrl+C skips it; during any other stage Ctrl+C is refused.
5. Acceptance: you confirm you are ready and repeat the mantra.

### Modes and exit codes

Wrapping a command: its stdout and stderr stream through live, and the grief uses its stderr (or stdout if stderr was empty). Eugene exits with the command's exit code, or 127 if the command was not found and 126 if it could not be started.

Pipe mode: Eugene reads all of stdin. If it contains nothing that looks like an error, it is passed through and Eugene exits 0. Otherwise the stages run, answers are read from the terminal (`/dev/tty`, or the console on Windows), the input is written to stdout and Eugene exits 1.

Eugene talks on stderr. When it cannot ask questions (stdin or stderr is not a terminal when wrapping a command; no terminal or stderr redirected in pipe mode), it prints all stages without waiting for answers.

Eugene's options go before `--`; values can be written `--speed fast` or `--speed=fast`. Unknown or invalid options, and arguments before `--`, print a one-line error to stderr and exit 1.

## Development

```bash
npm test              # node --test (test/**/*.test.ts)
npm run check         # biome check, typecheck and tests
npm run typecheck     # tsc
npm run lint          # biome lint
npm run format        # biome check --write
npm run build         # tsc to dist/
npm run dev -- -- npm test   # node --watch
```

## Non-goals

- Eugene is not a therapist (but it tries).
- Eugene will not fix your code.
- Eugene does not remember past sessions. Every failure is a fresh wound.
