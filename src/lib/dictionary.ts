import words from "./words.json";
import starterWords from "./starter-words.json";
import maskIndex from "./maskIndex.json";
import indexToMask from "./indexToMask.json";

export function isValid(word: string) {
  word = word.toLowerCase();
  let left = 0,
    right = words.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    if (words[mid] === word) {
      return true;
    }
    if (words[mid] < word) left = mid + 1;
    else right = mid - 1;
  }

  return false;
}

export function getRandomStarterWord() {
  return starterWords[Math.floor(Math.random() * starterWords.length)];
}

// Bitmask helpers and fast candidate management
export function wordMask(word: string): number {
  let m = 0;
  const seen = new Set<string>();
  for (const ch of word) {
    if (ch < "a" || ch > "z") continue;
    if (seen.has(ch)) continue;
    seen.add(ch);
    m |= 1 << (ch.charCodeAt(0) - 97);
  }
  return m >>> 0;
}

export function lettersToMask(letters: string): number {
  return wordMask(letters.toLowerCase());
}

// maskIndex: { [mask: string]: number[] } where numbers are indices into `words`
// indexToMask: number[] parallel to words

// Enumerate subsets of mask and collect candidate indices (skip usedSet)
export function buildCandidatesFromAllowedMask(
  allowedMask: number,
  usedSet: Set<number>,
): Set<number> {
  const candidates = new Set<number>();
  for (let sub = allowedMask; sub; sub = (sub - 1) & allowedMask) {
    const key = String(sub);
    const indices: number[] = maskIndex[key];
    if (!indices) continue;
    for (const idx of indices) {
      if (!usedSet.has(idx)) candidates.add(idx);
    }
  }
  return candidates;
}

// Filter candidate set when allowed letters shrink (guess)
export function filterCandidatesForShrunkMask(
  newMask: number,
  candidates: Set<number>,
): void {
  for (const idx of Array.from(candidates)) {
    const cm = indexToMask[idx];
    if ((cm & ~newMask) !== 0) candidates.delete(idx);
  }
}

// Expand candidate set when a single letter is added (bonus claim)
export function expandCandidatesForAddedLetter(
  prevMask: number,
  newMask: number,
  candidates: Set<number>,
  usedSet: Set<number>,
): void {
  const added = newMask & ~prevMask;
  if (added === 0) return;
  for (let sub = newMask; sub; sub = (sub - 1) & newMask) {
    if ((sub & added) === 0) continue; // require subset includes added bit
    const key = String(sub);
    const indices = maskIndex[key];
    if (!indices) continue;
    for (const idx of indices) {
      if (!usedSet.has(idx)) candidates.add(idx);
    }
  }
}

export { words };
