import assert from "node:assert/strict";
import { test } from "node:test";
import { bargaining, bargainingNonInteractive } from "../../src/stages/bargaining.ts";
import { withIo } from "../helpers.ts";

test("bargaining: offers three suggestions and waits for a reaction to each", async () => {
  await withIo({ answers: ["tempting", "no", "..."] }, async (s) => {
    await bargaining("Error in 'main.ts': type mismatch");
    const out = s.output();
    assert.equal(out.split("What if you just ").length - 1, 3);
    assert.equal(out.split("> ").length - 1, 3);
    assert.match(out, /What if you just mass-rename 'main\.ts' to 'main\.js'\?/);
    assert.match(out, /Good\. Let's work with what we have\.\n$/);
  });
});

test("bargaining: never says 'just just'", async () => {
  await withIo({ answers: ["a", "b", "c"] }, async (s) => {
    await bargaining("FAIL test/auth_test.ts");
    assert.ok(!s.output().includes("just just"), s.output());
  });
});

test("bargainingNonInteractive: offers two suggestions without asking", async () => {
  await withIo({}, (s) => {
    bargainingNonInteractive("Error: module 'foo' not found");
    const out = s.output();
    assert.equal(out.split("What if you just ").length - 1, 2);
    assert.ok(!out.includes("> "));
    assert.ok(!out.includes("just just"));
    assert.match(out, /\.\.\.no\. Let's work with what we have\.\n$/);
  });
});

test("bargainingNonInteractive: handles empty error output", async () => {
  await withIo({}, (s) => {
    bargainingNonInteractive("");
    assert.equal(s.output().split("What if you just ").length - 1, 2);
  });
});
