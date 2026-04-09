import { createSudoku } from './sudoku.js';
import { createGame } from './game.js';
import { deepClone } from './sudoku.js';

function createSudokuFromJSON(json) {
  if (!json || typeof json !== 'object' || !Array.isArray(json.grid)) {
    throw new Error('Invalid JSON: missing or invalid grid property');
  }
  return createSudoku(json.grid);
}

function createGameFromJSON(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid JSON: must be an object');
  }
  if (!json.sudoku || typeof json.sudoku !== 'object') {
    throw new Error('Invalid JSON: missing or invalid sudoku property');
  }

  const currentSudoku = createSudokuFromJSON(json.sudoku);

  const history = Array.isArray(json.history) ? json.history.map(h => {
    if (!h || !h.snapshot) {
      throw new Error('Invalid history entry: missing snapshot');
    }
    return {
      type: h.type || 'guess',
      snapshot: createSudokuFromJSON(h.snapshot)
    };
  }) : [];

  const redoHistory = Array.isArray(json.redoHistory) ? json.redoHistory.map(h => {
    if (!h || !h.snapshot) {
      throw new Error('Invalid redoHistory entry: missing snapshot');
    }
    return {
      type: h.type || 'guess',
      snapshot: createSudokuFromJSON(h.snapshot)
    };
  }) : [];

  return createGame({ sudoku: currentSudoku, history, redoHistory });
}

export {
  createSudokuFromJSON,
  createGameFromJSON
};
