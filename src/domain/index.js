const GRID_SIZE = 9;

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createSudoku(input) {
  const grid = deepClone(input);

  const sudoku = {
    getGrid() {
      return grid;
    },

    guess(move) {
      const { row, col, value } = move;
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        grid[row][col] = value;
      }
    },

    clone() {
      return createSudoku(deepClone(grid));
    },

    toJSON() {
      return {
        grid: deepClone(grid)
      };
    },

    toString() {
      let out = '╔═══════╤═══════╤═══════╗\n';
      for (let row = 0; row < GRID_SIZE; row++) {
        if (row !== 0 && row % 3 === 0) {
          out += '╟───────┼───────┼───────╢\n';
        }
        for (let col = 0; col < GRID_SIZE; col++) {
          if (col === 0) {
            out += '║ ';
          } else if (col % 3 === 0) {
            out += '│ ';
          }
          out += (grid[row][col] === 0 ? '·' : grid[row][col]) + ' ';
          if (col === GRID_SIZE - 1) {
            out += '║';
          }
        }
        out += '\n';
      }
      out += '╚═══════╧═══════╧═══════╝';
      return out;
    }
  };

  return sudoku;
}

function createSudokuFromJSON(json) {
  return createSudoku(json.grid);
}

function createGame({ sudoku, history = [], redoHistory = [] }) {
  let currentSudoku = sudoku.clone();

  const game = {
    getSudoku() {
      return currentSudoku;
    },

    guess(move) {
      history.push({
        type: 'guess',
        snapshot: currentSudoku.clone()
      });
      currentSudoku.guess(move);
      redoHistory.length = 0;
    },

    undo() {
      if (history.length === 0) return;

      const lastState = history.pop();
      redoHistory.push({
        type: 'guess',
        snapshot: currentSudoku.clone()
      });
      currentSudoku = lastState.snapshot;
    },

    redo() {
      if (redoHistory.length === 0) return;

      const nextState = redoHistory.pop();
      history.push({
        type: 'guess',
        snapshot: currentSudoku.clone()
      });
      currentSudoku = nextState.snapshot;
    },

    canUndo() {
      return history.length > 0;
    },

    canRedo() {
      return redoHistory.length > 0;
    },

    toJSON() {
      return {
        sudoku: currentSudoku.toJSON(),
        history: history.map(h => ({ type: h.type, snapshot: h.snapshot.toJSON() })),
        redoHistory: redoHistory.map(h => ({ type: h.type, snapshot: h.snapshot.toJSON() }))
      };
    }
  };

  return game;
}

function createGameFromJSON(json) {
  const currentSudoku = createSudokuFromJSON(json.sudoku);

  const history = json.history.map(h => ({
    type: h.type,
    snapshot: createSudokuFromJSON(h.snapshot)
  }));

  const redoHistory = json.redoHistory.map(h => ({
    type: h.type,
    snapshot: createSudokuFromJSON(h.snapshot)
  }));

  return createGame({ sudoku: currentSudoku, history, redoHistory });
}

export {
  createSudoku,
  createSudokuFromJSON,
  createGame,
  createGameFromJSON
};
