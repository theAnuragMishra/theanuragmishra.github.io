import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wordsPath = path.resolve(__dirname, "../src/lib/words.json");
const outMaskIndex = path.resolve(__dirname, "../src/lib/maskIndex.json");
const outIndexToMask = path.resolve(__dirname, "../src/lib/indexToMask.json");

export function wordMask(word) {
  let m = 0;
  for (const ch of word) {
    if (ch < "a" || ch > "z") continue;
    m |= 1 << (ch.charCodeAt(0) - 97);
  }
  return m >>> 0;
}

function main() {
  console.log("Reading words...");
  const words = JSON.parse(fs.readFileSync(wordsPath, "utf8"));

  const maskIndex = Object.create(null);
  const indexToMask = new Array(words.length);

  console.log("Computing masks...");
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const m = wordMask(w);
    indexToMask[i] = m;
    const key = String(m);
    if (!maskIndex[key]) maskIndex[key] = [];
    maskIndex[key].push(i);
  }

  console.log("Writing", outMaskIndex);
  fs.writeFileSync(outMaskIndex, JSON.stringify(maskIndex));
  console.log("Writing", outIndexToMask);
  fs.writeFileSync(outIndexToMask, JSON.stringify(indexToMask));
  console.log("Done");
}

//main();
