const NEGATION_PATTERNS = [
  /^no+!*$/i,
  /^nope!*$/i,
  /^nah!*$/i,
  /^never!*$/i,
  /^impossible!*$/i,
  /^can'?t be!*$/i,
  /^this is(n'?t| not) (real|happening|true|possible)/i,
  /^(that'?s|it'?s) (not |im)?possible/i,
  /^(bull|bs|lies)/i,
  /^(no|nope|nah) (way|chance)/i,
  /^refuse/i,
  /^i (don'?t|won'?t|can'?t) (believe|accept)/i,
];

export function isNegation(text: string): boolean {
  const trimmed = text.trim();
  return NEGATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function capsRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return 0;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length;
}

export function punctuationDensity(text: string): number {
  if (text.length === 0) return 0;
  const puncts = text.replace(/[^!?@#*]/g, "").length;
  return puncts / text.length;
}

export interface CalmScore {
  caps: number;
  punctuation: number;
  length: number;
}

export function calmScore(text: string): CalmScore {
  return {
    caps: capsRatio(text),
    punctuation: punctuationDensity(text),
    length: text.length,
  };
}

export function isCalm(text: string): boolean {
  const score = calmScore(text);
  return score.caps < 0.3 && score.punctuation < 0.15 && score.length < 40;
}
