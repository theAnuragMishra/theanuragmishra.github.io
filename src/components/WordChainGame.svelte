<script lang="ts">
  import { onMount } from "svelte";
  import type { GameState } from "../lib/gameStore";
  import {
    loadState,
    saveState,
    resetState,
    createInitialState,
  } from "../lib/gameStore";
  import Spinner from "./Spinner.svelte";

  // Game state
  type GameStateWithBonus = GameState;

  let gameState: GameStateWithBonus | null = $state(null);
  let currentInput = $state("");
  let errorMessage = $state("");
  let successMessage = $state("");
  let isStarting = $state(true);
  let starterInput = $state("");
  let errorKey = $state(0);
  let bonusLetterInput = $state("");

  // Dialog element reference
  let resetDialog: HTMLDialogElement;

  // Dictionary
  let wordSet: Set<string> | null = $state(null);
  let starterWords: string[] = $state([]);
  let isLoading = $state(true);

  // Load dictionary and starter words
  onMount(async () => {
    try {
      // Load main dictionary
      const wordsResponse = await fetch("/data/words.txt");
      const wordsText = await wordsResponse.text();
      const words = wordsText
        .trim()
        .split("\n")
        .map((w) => w.toLowerCase());
      wordSet = new Set(words);

      // Load starter words
      const startersResponse = await fetch("/data/starter-words.txt");
      const startersText = await startersResponse.text();
      starterWords = startersText
        .trim()
        .split("\n")
        .map((w) => w.toLowerCase());

      // Load game state
      const loaded = loadState();
      if (loaded) {
        gameState = loaded;
        isStarting = false;
      }

      isLoading = false;
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      errorMessage = "Failed to load word dictionary. Please refresh the page.";
      isLoading = false;
    }
  });

  // Get a random starter word
  function getRandomStarter(): string {
    if (starterWords.length === 0) return "crane";
    const randomIndex = Math.floor(Math.random() * starterWords.length);
    return starterWords[randomIndex];
  }

  // Start new game with a word
  function startGame() {
    const word = starterInput.trim().toLowerCase();

    if (!word) {
      errorMessage = "Please enter a starting word";
      errorKey++;
      return;
    }

    if (word.length !== 10) {
      errorMessage = "Starting word must be exactly 10 letters";
      errorKey++;
      return;
    }

    if (!/^[a-z]+$/.test(word)) {
      errorMessage = "Starting word must contain only letters";
      errorKey++;
      return;
    }

    if (!wordSet || !wordSet.has(word)) {
      errorMessage = "Starting word must be a valid English word";
      errorKey++;
      return;
    }

    gameState = createInitialState(word);
    saveState(gameState);
    isStarting = false;
    errorMessage = "";
    starterInput = "";
  }

  // Use random starter
  function useRandomStarter() {
    starterInput = getRandomStarter();
    starterInputEl?.focus();
  }

  // Check if a word can be formed from available letters
  function canFormWord(word: string, available: string): boolean {
    const allowed = new Set(available);

    for (const c of word) {
      if (!allowed.has(c)) return false;
    }

    return true;
  }

  // Submit a guess
  function submitGuess() {
    if (!gameState || !wordSet) return;

    const guess = currentInput.trim().toLowerCase();
    const previousScore = gameState.score;
    const hadPendingBonus = gameState.bonusAvailable || !!gameState.bonusLetter;

    // Clear messages
    errorMessage = "";
    successMessage = "";

    // Validation
    if (!guess) {
      errorMessage = "Please enter a word";
      errorKey++;
      return;
    }

    if (guess.length < 3) {
      errorMessage = "Word must be at least 3 letters";
      errorKey++;
      return;
    }

    if (!/^[a-z]+$/.test(guess)) {
      errorMessage = "Word must contain only letters";
      errorKey++;
      return;
    }

    if (!wordSet.has(guess)) {
      errorMessage = "Not a valid English word";
      errorKey++;
      return;
    }

    if (gameState.usedWords.includes(guess)) {
      errorMessage = "Word already used in this game";
      errorKey++;
      return;
    }

    const allowedLetters = gameState.bonusLetter
      ? `${gameState.currentWord}${gameState.bonusLetter}`
      : gameState.currentWord;

    if (!canFormWord(guess, allowedLetters)) {
      const bonusLabel = gameState.bonusLetter
        ? ` + bonus "${gameState.bonusLetter.toUpperCase()}"`
        : "";
      errorMessage = `Cannot form "${guess}" from letters in "${gameState.currentWord.toUpperCase()}"${bonusLabel}`;
      errorKey++;
      return;
    }

    // Valid guess!
    gameState.currentWord = guess;
    gameState.usedWords = [...gameState.usedWords, guess];
    gameState.score += guess.length;
    if (hadPendingBonus) {
      gameState.bonusAvailable = false;
      gameState.bonusLetter = null;
    }
    const crossedBonusThreshold =
      Math.floor(previousScore / 15) < Math.floor(gameState.score / 15);
    if (crossedBonusThreshold) {
      gameState.bonusAvailable = true;
      gameState.bonusLetter = null;
      bonusLetterInput = "";
    }
    saveState(gameState);

    successMessage = `+${guess.length} points!`;
    currentInput = "";

    // Clear success message after 2 seconds
    setTimeout(() => {
      successMessage = "";
    }, 2000);
  }

  // Handle Enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (isStarting) {
        startGame();
      } else {
        submitGuess();
      }
    }
  }

  // Open reset dialog
  function openResetDialog() {
    resetDialog?.showModal();
  }

  // Confirm reset
  function confirmReset() {
    resetState();
    gameState = null;
    isStarting = true;
    starterInput = "";
    currentInput = "";
    errorMessage = "";
    successMessage = "";
    bonusLetterInput = "";
    resetDialog?.close();
  }

  // Get unique available letters
  function getUniqueAvailableLetters(): string[] {
    if (!gameState) return [];
    const baseLetters = gameState.currentWord.toLowerCase().split("");
    if (gameState.bonusLetter) baseLetters.push(gameState.bonusLetter);
    return Array.from(new Set(baseLetters)).sort();
  }

  let inputEl: HTMLInputElement | undefined = $state();
  let starterInputEl: HTMLInputElement | undefined = $state();

  // Add letter to current input
  function addLetter(letter: string) {
    currentInput += letter;
    inputEl?.focus();
  }

  // Backspace
  function backspace() {
    currentInput = currentInput.slice(0, -1);
    inputEl?.focus();
  }

  // Clear input
  function clearInput() {
    currentInput = "";
    inputEl?.focus();
  }

  function claimBonusLetter() {
    if (!gameState) return;
    const trimmed = bonusLetterInput.trim().toLowerCase();

    errorMessage = "";
    successMessage = "";

    if (!gameState.bonusAvailable) {
      return;
    }

    if (!trimmed) {
      errorMessage = "Pick a bonus letter";
      errorKey++;
      return;
    }

    if (!/^[a-z]$/.test(trimmed)) {
      errorMessage = "Bonus letter must be a single letter";
      errorKey++;
      return;
    }

    gameState.bonusLetter = trimmed;
    gameState.bonusAvailable = false;
    bonusLetterInput = "";
    saveState(gameState);
  }

  function handleBonusKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      claimBonusLetter();
    }
  }
</script>

<!-- Reset Dialog (native HTML dialog) -->
<dialog
  bind:this={resetDialog}
  class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop:bg-black/50 dark:backdrop:bg-black/70 bg-white dark:bg-black border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-6 max-w-md w-3/4"
>
  <h2 class="text-2xl font-semibold mb-3 text-black dark:text-white">
    Reset Game?
  </h2>
  <p class="text-neutral-600 dark:text-neutral-400 mb-6">
    Are you sure you want to reset your game? Your current score of <strong
      class="text-black dark:text-white">{gameState?.score}</strong
    > will be lost.
  </p>
  <div class="flex gap-3">
    <button
      onclick={() => resetDialog?.close()}
      class="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium text-white"
    >
      Cancel
    </button>
    <button
      onclick={confirmReset}
      class="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
    >
      Reset
    </button>
  </div>
</dialog>

{#if isLoading}
  <Spinner />
{:else if isStarting}
  <!-- Starting screen -->
  <div class="flex items-center justify-center px-4 py-8 min-h-[60vh]">
    <div class="max-w-md w-full">
      <div class="mb-8 text-center">
        <h1
          class="text-3xl md:text-4xl font-semibold mb-2 text-black dark:text-white"
        >
          Wordchain
        </h1>
      </div>

      <div
        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8 border border-neutral-200 dark:border-neutral-800"
      >
        <h2 class="text-2xl font-semibold mb-4 text-black dark:text-white">
          Start a New Game
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
          Enter a 10-letter word to begin your chain. Make new words using only
          the letters from your current word (repetition allowed). Each word
          adds its length to your score.
        </p>

        <div class="space-y-4">
          <input
            type="text"
            bind:value={starterInput}
            onkeydown={handleKeydown}
            bind:this={starterInputEl}
            placeholder="Enter 10-letter word"
            maxlength="10"
            class="w-full px-4 py-3 text-lg text-center uppercase tracking-widest border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div class="flex gap-2">
            <button
              onclick={startGame}
              class="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Start Game
            </button>
            <button
              onclick={useRandomStarter}
              class="px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Random
            </button>
          </div>
        </div>

        {#if errorMessage}
          {#key errorKey}
            <div
              class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm animate-shake"
            >
              {errorMessage}
            </div>
          {/key}
        {/if}
      </div>
    </div>
  </div>
{:else if gameState}
  <!-- Active game -->
  <div class="flex flex-col">
    <div class="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1
            class="text-2xl md:text-3xl font-semibold text-black dark:text-white"
          >
            Wordchain
          </h1>
        </div>
        <button
          onclick={openResetDialog}
          class="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Reset
        </button>
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col space-y-6">
        <!-- Top section: Current word and score -->
        <div class="space-y-6">
          <!-- Current word display -->
          <div class="text-center">
            <div
              class="text-sm text-neutral-500 dark:text-neutral-500 mb-3 uppercase tracking-wide"
            >
              Current Word
            </div>
            <div
              class="inline-block bg-neutral-50 dark:bg-neutral-900 px-6 md:px-8 py-4 md:py-6 rounded-lg border-2 border-neutral-200 dark:border-neutral-800"
            >
              <div
                class="text-4xl md:text-5xl lg:text-6xl font-bold tracking-widest text-black dark:text-white"
              >
                {gameState.currentWord.toUpperCase()}
              </div>
            </div>
          </div>

          <!-- Score -->
          <div class="text-center">
            <div
              class="text-sm text-neutral-500 dark:text-neutral-500 mb-2 uppercase tracking-wide"
            >
              Score
            </div>
            <div
              class="text-3xl md:text-4xl font-bold tabular-nums text-black dark:text-white"
            >
              {gameState.score}
            </div>
          </div>

          <!-- Current input display -->
          <div class="text-center">
            <div
              class="text-xs text-neutral-500 dark:text-neutral-500 mb-2 uppercase tracking-wide"
            >
              Your Word
            </div>
            <div
              class="relative min-h-12 flex items-center justify-center bg-white dark:bg-black border-2 border-neutral-300 dark:border-neutral-700"
            >
              <input
                type="text"
                bind:value={currentInput}
                onkeydown={handleKeydown}
                inputmode="none"
                bind:this={inputEl}
                placeholder="Make a new word"
                class="flex-1 px-4 py-3 text-lg border bg-white dark:bg-black text-black dark:text-white focus:outline-none uppercase text-center"
              />
              {#if successMessage}
                <div
                  class="absolute -top-9 left-1/2 -translate-x-1/2 bg-black text-green-700 text-xs font-medium px-2.5 py-1 rounded shadow-sm"
                >
                  {successMessage}
                </div>
              {/if}
            </div>
          </div>

          <!-- Messages -->
          {#if errorMessage}
            {#key errorKey}
              <div
                class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm text-center animate-shake"
              >
                {errorMessage}
              </div>
            {/key}
          {/if}
        </div>

        <!-- Bottom section: Keyboard -->
        <div class="space-y-4 pb-4">
          {#if gameState.bonusAvailable || gameState.bonusLetter}
            <div
              class="flex flex-col items-center gap-2 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 bg-neutral-50 dark:bg-neutral-900"
            >
              <div class="text-xs text-neutral-500 uppercase tracking-wide">
                Bonus Letter (next word only)
              </div>
              {#if gameState.bonusAvailable && !gameState.bonusLetter}
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    bind:value={bonusLetterInput}
                    onkeydown={handleBonusKeydown}
                    maxlength="1"
                    placeholder="A"
                    class="w-16 h-10 text-center text-lg uppercase border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-black text-black dark:text-white focus:outline-none"
                  />
                  <button
                    onclick={claimBonusLetter}
                    class="px-3 py-2 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Claim
                  </button>
                </div>
              {:else if gameState.bonusLetter}
                <div class="text-sm font-semibold text-black dark:text-white">
                  Active: {gameState.bonusLetter.toUpperCase()}
                </div>
              {/if}
            </div>
          {/if}
          <!-- Letter keyboard -->
          <div
            class="text-xs text-neutral-500 dark:text-neutral-500 mb-2 text-center uppercase tracking-wide"
          >
            Available Letters
          </div>
          <div class="flex flex-wrap gap-2 max-w-md mx-auto justify-center">
            {#each getUniqueAvailableLetters() as letter}
              <button
                onclick={() => addLetter(letter)}
                class="aspect-square flex items-center justify-center text-xl md:text-2xl font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg transition-colors active:scale-95 uppercase px-3 py-1"
              >
                {letter}
              </button>
            {/each}
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 max-w-md mx-auto">
            <button
              onclick={backspace}
              class="flex-1 px-4 py-3 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg transition-colors"
            >
              ← Backspace
            </button>
            <button
              onclick={clearInput}
              class="px-4 py-3 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onclick={submitGuess}
              class="flex-1 px-4 py-3 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <!-- Word history -->
      {#if gameState.usedWords.length > 0}
        <div
          class="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800"
        >
          <div
            class="text-xs text-neutral-500 dark:text-neutral-500 mb-3 uppercase tracking-wide text-center"
          >
            Word History ({gameState.usedWords.length})
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            {#each gameState.usedWords as word, i}
              <div class="flex items-center">
                <span
                  class="inline-block px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                >
                  {word}
                </span>
                {#if i < gameState.usedWords.length - 1}
                  <span
                    class="inline-block mx-1 text-neutral-400 dark:text-neutral-600"
                    >→</span
                  >
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }

  .animate-shake {
    animation: shake 0.3s ease-in-out;
  }

  input::placeholder {
    color: rgb(163 163 163 / 0.5);
  }

  :global(.dark) input::placeholder {
    color: rgb(163 163 163 / 0.3);
  }

  /* Style the dialog backdrop */
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  :global(.dark) dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.7);
  }
</style>
