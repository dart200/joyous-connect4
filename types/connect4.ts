export const NUM_ROW = 6
export const NUM_COL = 7

export type CellState = '' | 'R' | 'Y';

// Based game data
export interface Connect4Game {
  /** current board state
   *  - stored [row][col]
   *  - [0][0] = bottom left cell
   */
  board: CellState[][];
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