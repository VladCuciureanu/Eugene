import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  canPromptOnStdio,
  eugeneSay,
  inputEnded,
  openTerminalInput,
  prompt,
} from "../src/prompt.ts";
import { withIo } from "./helpers.ts";

test("prompt: returns one trimmed line per call, even when several arrive at once", async () => {
  await withIo({ answers: ["  first  ", "second"], end: true }, async () => {
    assert.equal(await prompt(), "first");
    assert.equal(await prompt(), "second");
  });
});

test("prompt: waits for a line that has not been typed yet", async () => {
  await withIo({}, async (s) => {
    const answer = prompt();
    s.type("later");
    assert.equal(await answer, "later");
  });
});

test("prompt: writes the prefix to Eugene's output", async () => {
  await withIo({ answers: ["x"] }, async (s) => {
    await prompt("? ");
    assert.equal(s.output(), "? ");
  });
});

test("prompt: resolves to an empty string once input has ended", async () => {
  await withIo({ answers: ["only"], end: true }, async () => {
    assert.equal(await prompt(), "only");
    assert.equal(inputEnded(), true);
    assert.equal(await prompt(), "");
    assert.equal(await prompt(), "");
  });
});

test("prompt: handles CRLF line endings", async () => {
  await withIo({}, async (s) => {
    const answer = prompt();
    s.type("yes\r");
    assert.equal(await answer, "yes");
  });
});

test("eugeneSay: writes a labelled line to Eugene's output", async () => {
  await withIo({}, (s) => {
    eugeneSay("hello");
    assert.equal(s.output(), "Eugene: hello\n");
  });
});

test("openTerminalInput: returns null when the terminal cannot be opened", () => {
  assert.equal(openTerminalInput(join(tmpdir(), "eugene-no-such-terminal")), null);
});

test("openTerminalInput: returns null for something that is not a terminal", () => {
  const dir = mkdtempSync(join(tmpdir(), "eugene-"));
  try {
    const file = join(dir, "not-a-tty");
    writeFileSync(file, "");
    assert.equal(openTerminalInput(file), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("canPromptOnStdio: only when both stdin and stderr are terminals", () => {
  const saved = {
    stdin: Object.getOwnPropertyDescriptor(process.stdin, "isTTY"),
    stderr: Object.getOwnPropertyDescriptor(process.stderr, "isTTY"),
  };
  const stub = (stdin: boolean, stderr: boolean) => {
    Object.defineProperty(process.stdin, "isTTY", { value: stdin, configurable: true });
    Object.defineProperty(process.stderr, "isTTY", { value: stderr, configurable: true });
    return canPromptOnStdio();
  };
  try {
    assert.equal(stub(true, true), true);
    assert.equal(stub(true, false), false, "questions on a redirected stderr cannot be seen");
    assert.equal(stub(false, true), false);
  } finally {
    for (const [name, descriptor] of Object.entries(saved)) {
      const stream = name === "stdin" ? process.stdin : process.stderr;
      if (descriptor) Object.defineProperty(stream, "isTTY", descriptor);
      else delete (stream as { isTTY?: boolean }).isTTY;
    }
  }
});
