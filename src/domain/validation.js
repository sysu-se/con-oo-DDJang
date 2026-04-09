import { GRID_SIZE, VALID_VALUES } from './sudoku.js';

function validateGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
    throw new Error('Grid must be a 9x9 array');
  }
  for (let row = 0; row < GRID_SIZE; row++) {
    if (!Array.isArray(grid[row]) || grid[row].length !== GRID_SIZE) {
      throw new Error('Grid must be a 9x9 array');
    }
    for (let col = 0; col < GRID_SIZE; col++) {
      const val = grid[row][col];
      if (typeof val !== 'number' || !VALID_VALUES.includes(val)) {
        throw new Error(`Invalid value at [${row}][${col}]: ${val}`);
      }
    }
  }
}

function validateMove(move) {
  if (!move || typeof move.row !== 'number' || typeof move.col !== 'number' || typeof move.value !== 'number') {
    throw new Error('Move must have row, col, and value properties');
  }
  const { row, col, value } = move;
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    throw new Error(`Move coordinates out of bounds: row=${row}, col=${col}`);
  }
  if (!VALID_VALUES.includes(value)) {
    throw new Error(`Invalid move value: ${value}`);
  }
}

function validateSudoku(sudoku) {
  if (!sudoku || typeof sudoku.getGrid !== 'function' || typeof sudoku.guess !== 'function') {
    throw new Error('Invalid Sudoku instance');
  }
}

export {
  validateGrid,
  validateMove,
  validateSudoku
};
