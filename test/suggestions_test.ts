import { assertEquals, assert } from "jsr:@std/assert";
import { generateSuggestions } from "../src/suggestions.ts";

Deno.test("generateSuggestions: returns requested count", () => {
  const suggestions = generateSuggestions("some error", 3);
  assertEquals(suggestions.length, 3);
});

Deno.test("generateSuggestions: returns 2 when asked for 2", () => {
  const suggestions = generateSuggestions("some error", 2);
  assertEquals(suggestions.length, 2);
});

Deno.test("generateSuggestions: contextual for .ts files", () => {
  const suggestions = generateSuggestions("Error in 'main.ts': type mismatch", 3);
  const hasContextual = suggestions.some((s) => s.includes("main.ts") || s.includes("main.js"));
  assert(hasContextual, "Should include contextual suggestion for .ts file");
});

Deno.test("generateSuggestions: contextual for test files", () => {
  const suggestions = generateSuggestions("FAIL test/auth_test.ts", 3);
  const hasContextual = suggestions.some(
    (s) => s.includes("test") || s.includes("nobody checks")
  );
  assert(hasContextual, "Should include contextual suggestion for test file");
});

Deno.test("generateSuggestions: works with empty input", () => {
  const suggestions = generateSuggestions("", 3);
  assertEquals(suggestions.length, 3);
  // Should all be generic
  for (const s of suggestions) {
    assert(s.length > 0);
  }
});

Deno.test("generateSuggestions: contextual for .json files", () => {
  const suggestions = generateSuggestions("Error parsing 'package.json'", 3);
  const hasContextual = suggestions.some((s) => s.includes("package.json"));
  assert(hasContextual, "Should include contextual suggestion for .json file");
});
