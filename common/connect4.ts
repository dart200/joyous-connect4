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

export const countDir = (
  board: BoardState,
  moveRow:number,
  moveCol:number,
  rowDir:number,
  colDir:number,
) => {
  let col = moveCol
  let row = moveRow
  let cnt = 0
  let color = board[moveRow][moveCol]

  do {
    col += colDir
    row += rowDir

    if (col < 0 || col >= NUM_COL || row < 0 || row >= NUM_ROW)
      return cnt;

    console.log({row,col});
    if (board[row][col] === color) {
      cnt += 1
    } else {
      return cnt;
    }
  } while (true)
}

export const findWin = (board: BoardState, moveRow:number, moveCol:number) => {
  const cntDir = (rowDir:number,colDir:number) => countDir(board, moveRow, moveCol, rowDir, colDir);
  
  const vertCnt = cntDir(1,0) + cntDir(-1,0) + 1;
  const horzCnt = cntDir(0,1) + cntDir(0,-1) + 1;
  const diag1Cnt = cntDir(1,1) + cntDir(-1,-1) + 1;
  const diag2Cnt = cntDir(1,-1) + cntDir(-1,1) + 1;

  if ([vertCnt, horzCnt, diag1Cnt, diag2Cnt].find(cnt => cnt === 4))
    return board[moveRow][moveCol];
  
  return ''
}
