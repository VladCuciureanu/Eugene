import { assertEquals } from "jsr:@std/assert";
import { isNegation, capsRatio, punctuationDensity, isCalm } from "../src/sentiment.ts";

Deno.test("isNegation: detects denial words", () => {
  assertEquals(isNegation("no"), true);
  assertEquals(isNegation("NO"), true);
  assertEquals(isNegation("no!"), true);
  assertEquals(isNegation("nope"), true);
  assertEquals(isNegation("never"), true);
  assertEquals(isNegation("impossible"), true);
  assertEquals(isNegation("nah"), true);
  assertEquals(isNegation("no way"), true);
  assertEquals(isNegation("I don't believe"), true);
  assertEquals(isNegation("this isn't real"), true);
});

Deno.test("isNegation: accepts non-denial", () => {
  assertEquals(isNegation("fine"), false);
  assertEquals(isNegation("ok"), false);
  assertEquals(isNegation("yes"), false);
  assertEquals(isNegation("..."), false);
  assertEquals(isNegation("I guess"), false);
});

Deno.test("capsRatio: measures uppercase ratio", () => {
  assertEquals(capsRatio("HELLO"), 1);
  assertEquals(capsRatio("hello"), 0);
  assertEquals(capsRatio("Hello"), 0.2);
  assertEquals(capsRatio("!!!"), 0);
});

Deno.test("punctuationDensity: measures density", () => {
  assertEquals(punctuationDensity("!!!"), 1);
  assertEquals(punctuationDensity("hello"), 0);
  assertEquals(punctuationDensity("hi!"), 1 / 3);
});

Deno.test("isCalm: detects calm messages", () => {
  assertEquals(isCalm("ok"), true);
  assertEquals(isCalm("fine I guess"), true);
  assertEquals(isCalm("yeah"), true);
});

Deno.test("isCalm: detects angry messages", () => {
  assertEquals(isCalm("THIS IS GARBAGE AND I HATE EVERYTHING ABOUT IT"), false);
  assertEquals(isCalm("AAAARGH!!!!"), false);
  assertEquals(isCalm("!!!!????!!!!"), false);
});
