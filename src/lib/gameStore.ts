export interface GameState {
  currentWord: string;
  usedWords: string[];
  score: number;
  bonusAvailable: boolean;
  bonusLetter: string | null;
  startedAt: string;
  lastUpdatedAt: string;
}

const STORAGE_KEY = "wordchain_game_state";

/**
 * Load game state from localStorage
 */
export function loadState(): GameState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as GameState;
    return state;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return null;
  }
}

/**
 * Save game state to localStorage
 * Future: also POST to API endpoint
 */
export function saveState(state: GameState): void {
  if (typeof window === "undefined") return;

  try {
    state.lastUpdatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // TODO: Future implementation
    // syncToServer(state);
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

/**
 * Reset game state completely
 */
export function resetState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);

    // TODO: Future implementation
    // deleteFromServer();
  } catch (error) {
    console.error("Failed to reset game state:", error);
  }
}

/**
 * Create initial game state from a starting word
 */
export function createInitialState(startingWord: string): GameState {
  return {
    currentWord: startingWord.toLowerCase(),
    usedWords: [startingWord.toLowerCase()],
    score: 0,
    bonusAvailable: false,
    bonusLetter: null,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

// Placeholder for future API sync
/*
async function syncToServer(state: GameState): Promise<void> {
  try {
    await fetch('/api/game/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error('Failed to sync to server:', error);
  }
}

async function deleteFromServer(): Promise<void> {
  try {
    await fetch('/api/game/reset', { method: 'DELETE' });
  } catch (error) {
    console.error('Failed to delete from server:', error);
  }
}
*/
