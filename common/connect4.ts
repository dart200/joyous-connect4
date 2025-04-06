export const GAMES_PATH = 'games'
export const NUM_ROW = 6
export const NUM_COL = 7

export type CellState = '' | 'R' | 'Y';

// Based game data
export interface Connect4Game {
  /** current board state
   *  - this is technically an object map for number -> number[], because firestore does
   *    not allow arrays of array, but it functions as an array of arrays
   *  - stored [row][col]
   *  - [0][0] = bottom left cell
   */
  board: {[key:number]: CellState[]};
  /** uid for red player */
  playerR: String;
  /** uid for yellow player */
  playerY?: String;
  /** uid for active player */
  playerTurn: String;
  /** uid for player who won */
  playerWon?: String;
}
export type BoardState = Connect4Game["board"];

export const boardArr = (board: BoardState) => {
  const arr = [];
  for (let row = 0; row < NUM_ROW; row++) {
    arr.push(board[row])
  }
  return arr;
}

/**
 * Finds possible move row position based on column
 * 
 * @returns row number if possible, otherwise returns -1
 */
export const findMoveRow = (board: BoardState, moveCol: number) => {
  for (let row = 0; row < NUM_ROW; row++) {
    console.log({row, moveCol})
    if (board[row][moveCol] === '') return row
  }
  return -1
}

export const findWin = (board: BoardState) => {
  
}
