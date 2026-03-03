---
title: Detecting Game Over in Word Chain
pubDate: 2026-03-03
description: ""
cover:
  url: ""
  alt: ""
category: "tech"
draft: true
---

What happens once you reach a state where you have already used all possible words with the letters available?
We need to see if there's at least one word that can be formed using the letters available and that you haven't made already. My first attempt at this was a linear search of the entire dictionary:

```ts
export function isGameOver(used: Array<string>, available: string) {
  const t = performance.now();
  for (const word of words) {
    if (!used.includes(word) && canFormWord(word, available)) {
      console.log(performance.now() - t);
      return false;
    }
  }
  console.log(performance.now() - t);
  return true;
}
```

It was taking around 400-600 ms on average which is NOT acceptable!
