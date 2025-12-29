# grief

A CLI that walks you through the 5 stages of grief every time a command fails. Won't let you retry until you've processed it.

```
$ grief -- npm test

npm ERR! Test failed.

grief: The command failed. Here's what happened:
grief:   npm ERR! Test failed.
grief:
grief: Do you accept that this has happened?
> no
grief: I understand. But it did happen.
> NO!
grief: The logs don't lie.
> ...fine
grief: Let's move on.

grief: It's okay to be angry. Let it out.
> STUPID TESTS
grief: I hear you.
> IT WORKED ON MY MACHINE
grief: That must be incredibly frustrating.

grief: What if you just mass-remove all the tests? No tests, no failures.
> tempting
grief: What if you just mass-rewrite it in Rust? I heard Rust solves everything.
> ...
grief: Good. Let's work with what we have.

grief: ...
grief: It's okay to sit with this for a moment.
grief: Not every build succeeds. Not every test passes.
grief: And that's okay.

grief: Are you ready to try again?
> yes
grief: Say it with me: "The failure was not personal."
> the failure was not personal
grief: You may now retry your command. Go in peace.
```

## Install

```bash
deno install --allow-run --allow-env --allow-read -n grief src/main.ts
```

Or run directly:

```bash
deno run --allow-run --allow-env --allow-read src/main.ts -- <your-command>
```

## Usage

```bash
# Wrap any command
grief -- make build
grief -- npm test
grief -- cargo build

# Pipe into grief
some-command 2>&1 | grief
```

If the command succeeds, grief stays quiet and passes output through. If it fails, you process your emotions first.

## The 5 Stages

### 1. Denial

grief shows you the error and asks you to accept it. You can say "no" up to 3 times. After that, grief moves you forward — gently but firmly.

### 2. Anger

grief gives you space to vent. Type whatever you want. grief responds with empathy. It watches for you to calm down (fewer caps, shorter messages) before moving on.

Use `--anger-room` for unlimited venting. Type "I'm done" when you're ready.

### 3. Bargaining

grief suggests 2-3 absurd "quick fixes" based on your error output and waits for your reaction. Suggestions include renaming `.ts` files to `.js` ("TypeScript was a mistake anyway") and deleting test files ("if nobody checks, nobody fails").

### 4. Depression

A moment of silence. grief prints slowly, with pauses. ~15 seconds of quiet reflection.

You can skip this with Ctrl+C. grief respects this — it's a healthy boundary.

### 5. Acceptance

grief asks you to repeat an affirmation before handing back control. Default: *"The failure was not personal."* Customize with `--mantra`.

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
| `GRIEF_DISABLE=1` | Disable grief entirely. For cowards. |
| `NO_GRIEF=1` | Same as above. grief will print *"avoiding your emotions, I see"* once. |

## Non-interactive Mode

When grief can't detect a TTY (e.g., in CI or piped output), it prints all 5 stages non-interactively to stderr. You still have to read them. With your eyes.

## Development

```bash
# Run tests
deno task test

# Run directly
deno task dev -- npm test
```

## Non-goals

- grief is not a build tool
- grief is not a therapist (but it tries)
- grief will not actually fix your code
- grief will not remember past sessions — every failure is a fresh wound
