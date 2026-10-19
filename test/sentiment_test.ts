import assert from "node:assert/strict";
import { test } from "node:test";
import { isNegation, capsRatio, punctuationDensity, isCalm } from "../src/sentiment.ts";

test("isNegation: detects denial words", () => {
  assert.deepEqual(isNegation("no"), true);
  assert.deepEqual(isNegation("NO"), true);
  assert.deepEqual(isNegation("no!"), true);
  assert.deepEqual(isNegation("nope"), true);
  assert.deepEqual(isNegation("never"), true);
  assert.deepEqual(isNegation("impossible"), true);
  assert.deepEqual(isNegation("nah"), true);
  assert.deepEqual(isNegation("no way"), true);
  assert.deepEqual(isNegation("I don't believe"), true);
  assert.deepEqual(isNegation("this isn't real"), true);
});

test("isNegation: accepts non-denial", () => {
  assert.deepEqual(isNegation("fine"), false);
  assert.deepEqual(isNegation("ok"), false);
  assert.deepEqual(isNegation("yes"), false);
  assert.deepEqual(isNegation("..."), false);
  assert.deepEqual(isNegation("I guess"), false);
});

test("capsRatio: measures uppercase ratio", () => {
  assert.deepEqual(capsRatio("HELLO"), 1);
  assert.deepEqual(capsRatio("hello"), 0);
  assert.deepEqual(capsRatio("Hello"), 0.2);
  assert.deepEqual(capsRatio("!!!"), 0);
});

test("punctuationDensity: measures density", () => {
  assert.deepEqual(punctuationDensity("!!!"), 1);
  assert.deepEqual(punctuationDensity("hello"), 0);
  assert.deepEqual(punctuationDensity("hi!"), 1 / 3);
});

test("isCalm: detects calm messages", () => {
  assert.deepEqual(isCalm("ok"), true);
  assert.deepEqual(isCalm("fine I guess"), true);
  assert.deepEqual(isCalm("yeah"), true);
});

test("isCalm: detects angry messages", () => {
  assert.deepEqual(isCalm("THIS IS GARBAGE AND I HATE EVERYTHING ABOUT IT"), false);
  assert.deepEqual(isCalm("AAAARGH!!!!"), false);
  assert.deepEqual(isCalm("!!!!????!!!!"), false);
});
