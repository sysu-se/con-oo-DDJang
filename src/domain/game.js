import { createSudoku } from './sudoku.js';
import { createHistoryManager } from './history.js';
import { validateMove, validateSudoku } from './validation.js';

function createGame({ sudoku, history = [], redoHistory = [] }) {
  validateSudoku(sudoku);

  let currentSudoku = sudoku.clone();
  const historyManager = createHistoryManager();
  historyManager.loadFromJSON(history, redoHistory);

  const game = {
    guess(move) {
      validateMove(move);
      historyManager.push(currentSudoku);
      currentSudoku.guess(move);
    },

    undo() {
      const previousState = historyManager.undo(currentSudoku);
      if (previousState) {
        currentSudoku = previousState;
        return true;
      }
      return false;
    },

    redo() {
      const nextState = historyManager.redo(currentSudoku);
      if (nextState) {
        currentSudoku = nextState;
        return true;
      }
      return false;
    },

    canUndo() {
      return historyManager.canUndo();
    },

    canRedo() {
      return historyManager.canRedo();
    },

    getGrid() {
      return currentSudoku.getGrid();
    },

    getSudoku() {
      return currentSudoku.clone();
    },

    toJSON() {
      return {
        sudoku: currentSudoku.toJSON(),
        history: historyManager.getHistory(),
        redoHistory: historyManager.getRedoHistory()
      };
    }
  };

  return game;
}

export {
  createGame
};
