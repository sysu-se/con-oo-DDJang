import { GRID_SIZE } from './sudoku.js';

function isValidSudokuStructure(grid) {
  for (let i = 0; i < GRID_SIZE; i++) {
    const rowSet = new Set();
    const colSet = new Set();
    for (let j = 0; j < GRID_SIZE; j++) {
      const rowVal = grid[i][j];
      const colVal = grid[j][i];
      if (rowVal !== 0 && rowSet.has(rowVal)) return false;
      if (colVal !== 0 && colSet.has(colVal)) return false;
      rowSet.add(rowVal);
      colSet.add(colVal);
    }
  }
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 3 + i;
          const col = boxCol * 3 + j;
          const val = grid[row][col];
          if (val !== 0 && boxSet.has(val)) return false;
          boxSet.add(val);
        }
      }
    }
  }
  return true;
}

export {
  isValidSudokuStructure
};
