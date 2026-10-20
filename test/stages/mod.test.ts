import assert from "node:assert/strict";
import { test } from "node:test";
import type { EugeneOptions } from "../../src/cli.ts";
import { runStagesInteractive, runStagesNonInteractive } from "../../src/stages/mod.ts";
import { type Scripted, withIo } from "../helpers.ts";

const ERROR = "Error: boom\n  at main.ts:5";
const MANTRA = "The failure was not personal.";

function options(overrides: Partial<EugeneOptions> = {}): EugeneOptions {
  return {
    command: ["npm", "test"],
    hierarchical: false,
    speed: "slow",
    mantra: MANTRA,
    skipStages: [],
    angerRoom: false,
    pipeMode: false,
    help: false,
    ...overrides,
  };
}

/** Indexes of each marker in `text`, asserting they all appear in that order. */
function assertInOrder(text: string, markers: string[]) {
  let from = 0;
  for (const marker of markers) {
    const at = text.indexOf(marker, from);
    assert.ok(at >= 0, `expected "${marker}" after position ${from} in:\n${text}`);
    from = at + marker.length;
  }
}

/** Presses Ctrl+C as soon as the depression stage has started. */
function ctrlCDuringDepression(s: Scripted): Promise<void> {
  return new Promise((resolve) => {
    const poll = setInterval(() => {
      if (s.output().includes("Eugene: ...\n")) {
        clearInterval(poll);
        process.emit("SIGINT");
        resolve();
      }
    }, 5);
  });
}

const ANSWERS = [
  "no", // denial
  "fine", // denial accepted
  "STUPID TESTS", // anger
  "ok", // anger, calm
  "tempting", // bargaining x3
  "no",
  "...",
  "yes", // ready?
  MANTRA,
];

test("runStagesInteractive: walks through all five stages with scripted answers", async () => {
  await withIo({ answers: ANSWERS }, async (s) => {
    const pressed = ctrlCDuringDepression(s);
    const start = performance.now();
    await runStagesInteractive(ERROR, options());
    await pressed;
    const out = s.output();
    assertInOrder(out, [
      "Here's what happened:",
      "Eugene:   Error: boom",
      "Do you accept that this has happened?",
      "I understand. But it did happen.",
      "Let's move on.",
      "It's okay to be angry.",
      "You're calming down",
      "What if you just",
      "Good. Let's work with what we have.",
      "Eugene: ...",
      "Fine. We'll move on.",
      "Are you ready to try again?",
      `Say it with me: "${MANTRA}"`,
      "Go in peace.",
    ]);
    assert.ok(!out.includes("whose fault"), "no blame stage without --hierarchical");
    assert.ok(!out.includes("Not every build succeeds"), "Ctrl+C skipped the rest of depression");
    assert.ok(performance.now() - start < 2000, "depression was skipped, not waited out");
  });
});

test("runStagesInteractive: Ctrl+C outside depression is refused", async () => {
  await withIo({}, async (s) => {
    const run = runStagesInteractive(ERROR, options({ skipStages: [2, 3, 4, 5] }));
    await new Promise((resolve) => setImmediate(resolve));
    process.emit("SIGINT");
    s.type("ok");
    await run;
    assertInOrder(s.output(), [
      "Do you accept",
      "You can't interrupt grief. Only process it.",
      "Let's move on.",
    ]);
    assert.equal(process.listenerCount("SIGINT"), 0, "the SIGINT handler is removed afterwards");
  });
});

test("runStagesInteractive: skipped stages are announced and --hierarchical adds blame", async () => {
  await withIo({ answers: ["ok", "me"] }, async (s) => {
    await runStagesInteractive(ERROR, options({ skipStages: [2, 3, 4, 5], hierarchical: true }));
    assertInOrder(s.output(), [
      "Do you accept",
      "Skipping anger. Grief counselors do not recommend this.",
      "Skipping bargaining.",
      "Skipping depression.",
      "Skipping acceptance.",
      "whose fault was this?",
      "Self-awareness. Noted.",
    ]);
  });
});

test("runStagesNonInteractive: prints every stage without asking anything", async () => {
  await withIo({}, (s) => {
    runStagesNonInteractive(ERROR, options({ hierarchical: true }));
    const out = s.output();
    assertInOrder(out, [
      "The command failed.",
      "Eugene:   Error: boom",
      "You must accept this. Moving on.",
      "We'll skip the venting this time.",
      "What if you just",
      "...no. Let's work with what we have.",
      "Not every build succeeds.",
      `Remember: "${MANTRA}"`,
      "Go in peace.",
      "Someone is responsible for this.",
      "Noted.",
    ]);
    assert.ok(!out.includes("> "), "no prompts");
  });
});

test("runStagesNonInteractive: honours --skip-stage", async () => {
  await withIo({}, (s) => {
    runStagesNonInteractive(ERROR, options({ skipStages: [1, 5] }));
    const out = s.output();
    assertInOrder(out, [
      "Skipping denial.",
      "It's okay to be angry.",
      "What if you just",
      "Not every build succeeds.",
      "Skipping acceptance.",
    ]);
    assert.ok(!out.includes("The command failed."));
    assert.ok(!out.includes("Remember:"));
  });
});
