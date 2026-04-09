import { deepClone } from './sudoku.js';

function createHistoryManager() {
  const history = [];
  const redoHistory = [];

  return {
    push(snapshot) {
      history.push({
        type: 'guess',
        snapshot: snapshot.clone()
      });
      redoHistory.length = 0;
    },

    undo(currentSnapshot) {
      if (history.length === 0) return null;

      const lastState = history.pop();
      redoHistory.push({
        type: 'guess',
        snapshot: currentSnapshot.clone()
      });
      return lastState.snapshot;
    },

    redo(currentSnapshot) {
      if (redoHistory.length === 0) return null;

      const nextState = redoHistory.pop();
      history.push({
        type: 'guess',
        snapshot: currentSnapshot.clone()
      });
      return nextState.snapshot;
    },

    canUndo() {
      return history.length > 0;
    },

    canRedo() {
      return redoHistory.length > 0;
    },

    getHistory() {
      return deepClone(history);
    },

    getRedoHistory() {
      return deepClone(redoHistory);
    },

    loadFromJSON(historyData, redoHistoryData) {
      history.length = 0;
      redoHistory.length = 0;
      if (Array.isArray(historyData)) {
        history.push(...historyData);
      }
      if (Array.isArray(redoHistoryData)) {
        redoHistory.push(...redoHistoryData);
      }
    }
  };
}

export {
  createHistoryManager
};
