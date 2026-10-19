import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSuggestions } from "../src/suggestions.ts";

test("generateSuggestions: returns requested count", () => {
  const suggestions = generateSuggestions("some error", 3);
  assert.deepEqual(suggestions.length, 3);
});

test("generateSuggestions: returns 2 when asked for 2", () => {
  const suggestions = generateSuggestions("some error", 2);
  assert.deepEqual(suggestions.length, 2);
});

test("generateSuggestions: contextual for .ts files", () => {
  const suggestions = generateSuggestions("Error in 'main.ts': type mismatch", 3);
  const hasContextual = suggestions.some((s) => s.includes("main.ts") || s.includes("main.js"));
  assert.ok(hasContextual, "Should include contextual suggestion for .ts file");
});

test("generateSuggestions: contextual for test files", () => {
  const suggestions = generateSuggestions("FAIL test/auth_test.ts", 3);
  const hasContextual = suggestions.some(
    (s) => s.includes("test") || s.includes("nobody checks")
  );
  assert.ok(hasContextual, "Should include contextual suggestion for test file");
});

test("generateSuggestions: works with empty input", () => {
  const suggestions = generateSuggestions("", 3);
  assert.deepEqual(suggestions.length, 3);
  // Should all be generic
  for (const s of suggestions) {
    assert.ok(s.length > 0);
  }
});

test("generateSuggestions: contextual for .json files", () => {
  const suggestions = generateSuggestions("Error parsing 'package.json'", 3);
  const hasContextual = suggestions.some((s) => s.includes("package.json"));
  assert.ok(hasContextual, "Should include contextual suggestion for .json file");
});
