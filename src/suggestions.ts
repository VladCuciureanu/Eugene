const GENERIC_SUGGESTIONS = [
  "mass-delete all the types? No types, no type errors.",
  "mass-remove all the tests? No tests, no failures.",
  "mass-rewrite it in Rust? I heard Rust solves everything.",
  "mass-replace everything with console.log? At least you'd know what's happening.",
  "mass-delete node_modules and pray? It's worked before.",
  "mass-convert it to a microservice? That'll definitely simplify things.",
  "mass-revert to the last commit that worked and pretend today never happened?",
  "mass-add '// @ts-ignore' above every line?",
  "mass-replace your build tool with a shell script that just echoes 'success'?",
  "mass-turn it off and on again? The whole computer.",
  "mass-switch to a language without errors? I hear HTML is nice.",
  "mass-copy the answer from Stack Overflow without reading it?",
];

function extractKeywords(errorOutput: string): string[] {
  const keywords: string[] = [];

  const fileMatch = errorOutput.match(/[\w/.-]+\.\w{1,4}/g);
  if (fileMatch) keywords.push(...fileMatch.slice(0, 3));

  const quotedMatch = errorOutput.match(/'([^']+)'/g);
  if (quotedMatch) {
    keywords.push(...quotedMatch.map((m) => m.replace(/'/g, "")).slice(0, 2));
  }

  return [...new Set(keywords)];
}

function contextualSuggestion(keyword: string): string | null {
  if (keyword.endsWith(".ts") || keyword.endsWith(".tsx")) {
    return `mass-rename '${keyword}' to '${keyword.replace(/\.tsx?$/, ".js")}'? TypeScript was a mistake anyway.`;
  }
  if (keyword.endsWith(".js")) {
    return `mass-delete '${keyword}' entirely? JavaScript was a mistake. The file is just living up to its heritage.`;
  }
  if (keyword.endsWith(".json")) {
    return `mass-replace '${keyword}' with an empty object? {} solves most JSON problems.`;
  }
  if (keyword.endsWith(".css") || keyword.endsWith(".scss")) {
    return `mass-add '!important' to every rule in '${keyword}'? CSS respects confidence.`;
  }
  if (keyword.includes("test") || keyword.includes("spec")) {
    return `mass-delete '${keyword}'? If nobody checks, nobody fails.`;
  }
  return null;
}

/** Returns a shuffled copy of `items` (Fisher-Yates), using `random` in [0, 1). */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Picks `count` suggestions: ones about files named in the error first, then generic ones in
 * an order chosen by `random`.
 */
export function generateSuggestions(
  errorOutput: string,
  count = 3,
  random: () => number = Math.random,
): string[] {
  const suggestions: string[] = [];
  const keywords = extractKeywords(errorOutput);

  for (const kw of keywords) {
    if (suggestions.length >= count) break;
    const s = contextualSuggestion(kw);
    if (s) suggestions.push(s);
  }

  for (const s of shuffle(GENERIC_SUGGESTIONS, random)) {
    if (suggestions.length >= count) break;
    suggestions.push(s);
  }

  return suggestions;
}
