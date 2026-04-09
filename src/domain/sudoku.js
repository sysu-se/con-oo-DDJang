const GRID_SIZE = 9;
const VALID_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createSudoku(input) {
  const grid = deepClone(input);

  const sudoku = {
    getGrid() {
      return deepClone(grid);
    },

    guess(move) {
      const { row, col, value } = move;
      grid[row][col] = value;
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

export {
  createSudoku,
  GRID_SIZE,
  VALID_VALUES,
  deepClone
};
