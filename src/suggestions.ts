const GENERIC_SUGGESTIONS = [
  "mass-delete all the types? No types, no type errors.",
  "mass-remove all the tests? No tests, no failures.",
  "mass-rewrite it in Rust? I heard Rust solves everything.",
  "mass-replace everything with console.log? At least you'd know what's happening.",
  "mass-delete node_modules and pray? It's worked before.",
  "mass-convert it to a microservice? That'll definitely simplify things.",
  "mass-revert to the last commit that worked and pretend today never happened?",
  "just mass-add '// @ts-ignore' above every line?",
  "mass-replace your build tool with a shell script that just echoes 'success'?",
  "mass-turn it off and on again? The whole computer.",
  "mass-switch to a language without errors? I hear HTML is nice.",
  "just mass-copy the answer from Stack Overflow without reading it?",
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
    return `just mass-rename '${keyword}' to '${keyword.replace(/\.tsx?$/, ".js")}'? TypeScript was a mistake anyway.`;
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
    return `just mass-delete '${keyword}'? If nobody checks, nobody fails.`;
  }
  return null;
}

export function generateSuggestions(errorOutput: string, count = 3): string[] {
  const suggestions: string[] = [];
  const keywords = extractKeywords(errorOutput);

  for (const kw of keywords) {
    if (suggestions.length >= count) break;
    const s = contextualSuggestion(kw);
    if (s) suggestions.push(s);
  }

  const shuffled = [...GENERIC_SUGGESTIONS].sort(() => Math.random() - 0.5);
  for (const s of shuffled) {
    if (suggestions.length >= count) break;
    suggestions.push(s);
  }

  return suggestions;
}
