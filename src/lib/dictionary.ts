import words from "./words.json";
import starterWords from "./starter-words.json";

export function isValid(word: string) {
  word = word.toLowerCase();
  let left = 0,
    right = words.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    // console.log(words[mid]);
    if (words[mid] === word) {
      //   console.log(words[mid]);
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
