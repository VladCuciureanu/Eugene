import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptance, acceptanceNonInteractive } from "../../src/stages/acceptance.ts";
import { withIo } from "../helpers.ts";

const MANTRA = "The failure was not personal.";

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

test("acceptance: accepts the mantra regardless of case and punctuation", async () => {
  await withIo({ answers: ["yes", "the failure, was NOT personal"] }, async (s) => {
    await acceptance(MANTRA);
    assert.match(s.output(), /Say it with me: "The failure was not personal\."/);
    assert.match(s.output(), /Go in peace\./);
    assert.equal(count(s.output(), "Try again"), 0);
  });
});

test("acceptance: a long reply that is not the mantra is rejected", async () => {
  const answers = ["yes", "whatever, I just want to go home", MANTRA];
  await withIo({ answers }, async (s) => {
    await acceptance(MANTRA);
    assert.equal(count(s.output(), "Try again. The full mantra."), 1);
    assert.match(s.output(), /Go in peace\./);
  });
});

test("acceptance: a partial mantra is rejected", async () => {
  await withIo({ answers: ["yes", "the failure was not", MANTRA] }, async (s) => {
    await acceptance(MANTRA);
    assert.equal(count(s.output(), "Try again. The full mantra."), 1);
  });
});

test("acceptance: answering 'no' to 'ready?' asks again before the mantra", async () => {
  await withIo({ answers: ["no", "nope", "ok", MANTRA] }, async (s) => {
    await acceptance(MANTRA);
    const out = s.output();
    assert.equal(count(out, "Are you ready to try again?"), 3);
    assert.ok(out.indexOf("Take your time") < out.indexOf("Say it with me"));
  });
});

test("acceptance: a custom mantra with digits must be said in full", async () => {
  await withIo({ answers: ["yes", "bugs happen", "Bugs happen 24/7"] }, async (s) => {
    await acceptance("Bugs happen 24/7.");
    assert.equal(count(s.output(), "Try again"), 1);
  });
});

test("acceptance: ends instead of looping forever when input runs out", async () => {
  await withIo({ answers: ["yes"], end: true }, async (s) => {
    await acceptance(MANTRA);
    assert.ok(count(s.output(), "Try again") <= 1);
  });
});

test("acceptanceNonInteractive: reminds of the mantra and lets you go", async () => {
  await withIo({}, (s) => {
    acceptanceNonInteractive("Bugs are features in disguise.");
    assert.equal(
      s.output(),
      'Eugene: Remember: "Bugs are features in disguise."\n' +
        "Eugene: You may now retry your command. Go in peace.\n",
    );
  });
});
