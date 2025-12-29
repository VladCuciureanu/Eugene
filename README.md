# Eugene

A CLI that walks you through the 5 stages of grief every time a command fails. Won't let you retry until you've processed it.

```
$ eugene -- npm test

npm ERR! Test failed.

Eugene: The command failed. Here's what happened:
Eugene:   npm ERR! Test failed.
Eugene:
Eugene: Do you accept that this has happened?
> no
Eugene: I understand. But it did happen.
> NO!
Eugene: The logs don't lie.
> ...fine
Eugene: Let's move on.

Eugene: It's okay to be angry. Let it out.
> STUPID TESTS
Eugene: I hear you.
> IT WORKED ON MY MACHINE
Eugene: That must be incredibly frustrating.

Eugene: What if you just mass-remove all the tests? No tests, no failures.
> tempting
Eugene: What if you just mass-rewrite it in Rust? I heard Rust solves everything.
> ...
Eugene: Good. Let's work with what we have.

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

## Install

```bash
deno install --allow-run --allow-env --allow-read -n eugene src/main.ts
```

Or run directly:

```bash
deno run --allow-run --allow-env --allow-read src/main.ts -- <your-command>
```

## Usage

```bash
# Wrap any command
eugene -- make build
eugene -- npm test
eugene -- cargo build

# Pipe into eugene
some-command 2>&1 | eugene
```

If the command succeeds, Eugene stays quiet and passes output through. If it fails, you process your emotions first.

## The 5 Stages

### 1. Denial

Eugene shows you the error and asks you to accept it. You can say "no" up to 3 times. After that, Eugene moves you forward — gently but firmly.

### 2. Anger

Eugene gives you space to vent. Type whatever you want. Eugene responds with empathy. It watches for you to calm down (fewer caps, shorter messages) before moving on.

Use `--anger-room` for unlimited venting. Type "I'm done" when you're ready.

### 3. Bargaining

Eugene suggests 2-3 absurd "quick fixes" based on your error output and waits for your reaction. Suggestions include renaming `.ts` files to `.js` ("TypeScript was a mistake anyway") and deleting test files ("if nobody checks, nobody fails").

### 4. Depression

A moment of silence. Eugene prints slowly, with pauses. ~15 seconds of quiet reflection.

You can skip this with Ctrl+C. Eugene respects this — it's a healthy boundary.

### 5. Acceptance

Eugene asks you to repeat an affirmation before handing back control. Default: *"The failure was not personal."* Customize with `--mantra`.

## Options

| Flag | Description |
|---|---|
| `--hierarchical` | Manager mode. Adds a 6th stage: **blame**. Asks whose fault it was, then says "noted." |
| `--speed <mode>` | `slow` (default), `fast` (shorter pauses), `instant` (no pauses — just kidding, still has pauses) |
| `--mantra <text>` | Custom affirmation for the acceptance stage |
| `--skip-stage <n>` | Skip a stage (1-5). Grief counselors do not recommend this. |
| `--anger-room` | Extend the anger stage indefinitely until you type "I'm done" |

## Environment Variables

| Variable | Description |
|---|---|
| `EUGENE_DISABLE=1` | Disable Eugene entirely. For cowards. |
| `NO_EUGENE=1` | Same as above. Eugene will print *"avoiding your emotions, I see"* once. |

## Non-interactive Mode

When Eugene can't detect a TTY (e.g., in CI or piped output), it prints all 5 stages non-interactively to stderr. You still have to read them. With your eyes.

## Development

```bash
# Run tests
deno task test

# Run directly
deno task dev -- npm test
```

## Non-goals

- Eugene is not a build tool
- Eugene is not a therapist (but it tries)
- Eugene will not actually fix your code
- Eugene will not remember past sessions — every failure is a fresh wound
