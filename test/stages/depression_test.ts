import assert from "node:assert/strict";
import { test } from "node:test";
import { depression, depressionNonInteractive } from "../../src/stages/depression.ts";
import { createSigintController } from "../../src/stages/mod.ts";
import { withIo } from "../helpers.ts";

test("depressionNonInteractive: prints the reflection at once", async () => {
  await withIo({}, (s) => {
    depressionNonInteractive();
    assert.equal(
      s.output(),
      "Eugene: ...\n" +
        "Eugene: Not every build succeeds. Not every test passes.\n" +
        "Eugene: And that's okay.\n",
    );
  });
});

test("depression: an already-aborted stage only sighs", async () => {
  await withIo({}, async (s) => {
    const controller = new AbortController();
    controller.abort();
    await depression("slow", controller.signal);
    assert.equal(s.output(), "Eugene: ...\n");
  });
});

test("depression: aborting the signal skips the rest of the stage", async () => {
  await withIo({}, async (s) => {
    const controller = new AbortController();
    const start = performance.now();
    const run = depression("slow", controller.signal);
    setTimeout(() => controller.abort(), 20);
    await run;
    // Slow speed takes ~13s uninterrupted; an abort must end it promptly.
    assert.ok(performance.now() - start < 1000, "depression should end soon after abort");
    assert.ok(!s.output().includes("sit with this"), "nothing more is printed after the abort");
  });
});

test("depression: SIGINT controller aborts a running depression stage", async () => {
  await withIo({}, async (s) => {
    const sigint = createSigintController();
    const signal = sigint.beginSkippable();
    const start = performance.now();
    const run = depression("slow", signal);
    setTimeout(() => sigint.handler(), 20);
    await run;
    sigint.endSkippable();
    assert.ok(signal.aborted);
    assert.ok(performance.now() - start < 1000, "Ctrl+C should skip depression");
    assert.match(s.output(), /Fine\. We'll move on\.\n$/);
  });
});

test("createSigintController: SIGINT outside a skippable stage aborts nothing", async () => {
  await withIo({}, (s) => {
    const sigint = createSigintController();
    sigint.handler();
    const signal = sigint.beginSkippable();
    assert.equal(signal.aborted, false);
    sigint.endSkippable();
    sigint.handler();
    assert.equal(signal.aborted, false);
    assert.equal(s.output().split("You can't interrupt grief. Only process it.").length - 1, 2);
  });
});
