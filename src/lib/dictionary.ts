const wordList = await fetch(
  `http://${import.meta.env.PUBLIC_SERVER_URL}/static/words-8ed58bdf0e26b4a0d72b09751857fa8ba570a673.json`,
).then((res) => res.json());

const starterWordList = wordList.filter((w: string) => w.length === 10);

const wordToIndex = new Map<string, number>();
const indexToMask = new Uint32Array(wordList.length);
const maskIndex = new Map<number, number[]>();

for (let i = 0; i < wordList.length; i++) {
  const w = wordList[i];
  wordToIndex.set(w, i);
  const mask = wordMask(w);
  indexToMask[i] = mask;
  const bucket = maskIndex.get(mask);
  if (bucket) bucket.push(i);
  else maskIndex.set(mask, [i]);
}

export function isValid(word: string) {
  return wordToIndex.has(word.toLowerCase());
}

export function getRandomStarterWord() {
  return starterWordList[Math.floor(Math.random() * starterWordList.length)];
}

// Bitmask helpers and fast candidate management
export function wordMask(word: string): number {
  let m = 0;
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i) - 97;
    if (code >= 0 && code < 26) {
      m |= 1 << code;
    }
  }
  return m >>> 0;
}

export function lettersToMask(letters: string): number {
  return wordMask(letters.toLowerCase());
}

export function getWordIndex(word: string): number {
  return wordToIndex.get(word.toLowerCase()) ?? -1;
}

// Enumerate subsets of mask and collect candidate indices (skip usedSet)
export function buildCandidatesFromAllowedMask(
  allowedMask: number,
  usedSet: Set<number>,
): Set<number> {
  const candidates = new Set<number>();
  for (let sub = allowedMask; sub; sub = (sub - 1) & allowedMask) {
    const indices = maskIndex.get(sub);
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
    const indices = maskIndex.get(sub);
    if (!indices) continue;
    for (const idx of indices) {
      if (!usedSet.has(idx)) candidates.add(idx);
    }
  }
}
