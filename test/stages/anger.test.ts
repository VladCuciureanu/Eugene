import assert from "node:assert/strict";
import { test } from "node:test";
import { anger, angerNonInteractive } from "../../src/stages/anger.ts";
import { withIo } from "../helpers.ts";

test("anger: moves on once you calm down after at least two messages", async () => {
  await withIo({ answers: ["STUPID TESTS!!!", "ok fine", "unused"] }, async (s) => {
    await anger(false);
    const out = s.output();
    assert.match(out, /It's okay to be angry\. Let it out\./);
    assert.match(out, /That must be incredibly frustrating\./);
    assert.match(out, /You're calming down/);
  });
});

test("anger: a calm first message is not enough", async () => {
  await withIo({ answers: ["fine", "fine"] }, async (s) => {
    await anger(false);
    assert.match(s.output(), /That must be incredibly frustrating\.[\s\S]*calming down/);
  });
});

test("anger: stops after five furious messages", async () => {
  await withIo({ answers: Array(5).fill("WHY!!!") }, async (s) => {
    await anger(false);
    assert.match(s.output(), /Good\. Feel that\. Now breathe\./);
  });
});

test("anger room: continues until you say you're done", async () => {
  const answers = ["calm words", "more calm words", "and more", "still here", "again", "I'm done"];
  await withIo({ answers }, async (s) => {
    await anger(true);
    assert.match(s.output(), /Good\. You've processed it\./);
    assert.equal(s.output().split("> ").length - 1, answers.length);
  });
});

test("anger room: ends when input runs out instead of looping forever", async () => {
  await withIo({ answers: ["ARGH"], end: true }, async (s) => {
    await anger(true);
    assert.match(s.output(), /Good\. You've processed it\./);
  });
});

test("angerNonInteractive: validates without asking", async () => {
  await withIo({}, (s) => {
    angerNonInteractive();
    assert.equal(
      s.output(),
      "Eugene: It's okay to be angry. We'll skip the venting this time.\n" +
        "Eugene: But know that your anger is valid.\n",
    );
  });
});
