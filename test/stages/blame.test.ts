import assert from "node:assert/strict";
import { test } from "node:test";
import { blame, blameNonInteractive } from "../../src/stages/blame.ts";
import { withIo } from "../helpers.ts";

async function blameReply(answer: string): Promise<string> {
  return withIo({ answers: [answer] }, async (s) => {
    await blame();
    // The last line, minus the "> " prompt it follows.
    return (s.output().split("\n").at(-2) ?? "").replace(/^> /, "");
  });
}

test("blame: owning it is noted as self-awareness", async () => {
  for (const answer of ["me", "Me.", "my fault", "it was mine", "blame ME"]) {
    assert.equal(await blameReply(answer), "Eugene: Self-awareness. Noted.", answer);
  }
});

test("blame: names that merely contain 'me' or 'my' blame someone else", async () => {
  assert.equal(await blameReply("James"), "Eugene: James. Noted.");
  assert.equal(await blameReply("Jeremy"), "Eugene: Jeremy. Noted.");
  assert.equal(await blameReply("the enemy"), "Eugene: the enemy. Noted.");
  assert.equal(await blameReply("Tommy"), "Eugene: Tommy. Noted.");
});

test("blame: silence is noted", async () => {
  assert.equal(await blameReply(""), "Eugene: Silence. Also noted.");
});

test("blameNonInteractive: notes it anyway", async () => {
  await withIo({}, (s) => {
    blameNonInteractive();
    assert.equal(
      s.output(),
      "Eugene: Someone is responsible for this. You know who.\nEugene: Noted.\n",
    );
  });
});
