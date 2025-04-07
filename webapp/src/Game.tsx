import { useEffect, useState } from "react";
import { User } from "./firebase"
import { CellState, Connect4Game, GAMES_PATH, NUM_COL, NUM_ROW } from "../../common/connect4";

import {alpha} from "@mui/material";
import Box, { BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const GameCell = (props: {cell: CellState}) => (
  <Box
    sx={{
      width: 100,
      height: 100,
      border: '1px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {props.cell && (
        <Box sx={{
          width: 75,
          height: 75,
          borderRadius: '50%',
          bgcolor: props.cell === 'R' ? 'error.main'
            : props.cell === 'Y' ? 'warning.main'
              : ''
        }}
      />
    )}
  </Box>
)

const GameCol = (props: BoxProps & {playerTurn: boolean}) => (
  <Box
    sx={(theme) => ({
      ...props.playerTurn && {
        transition: 'background 0.1s linear',
        '&:hover': {
          bgcolor: alpha(theme.palette.secondary.main, 0.2),
        },
      }
    })}
    {...props}
  /> 
)

export const Game = (args: {user: User, gameId: string}) => {
  const {user,gameId} = args;

  const [gameData, setGameData] = useState<Connect4Game|null>(null);
  useEffect(() => gameId ? user.subDoc(GAMES_PATH+'/'+gameId, setGameData) : undefined, [gameId])

  const playingAs: CellState = 
    user.auth.currentUser?.uid === gameData?.playerR ? 'R' :
      user.auth.currentUser?.uid === gameData?.playerY ? 'Y' :
        "";
  const playerTurn = user.auth.currentUser?.uid === gameData?.playerTurn;
  const playerWon = user.auth.currentUser?.uid === gameData?.playerWon;
  const playerLost = gameData?.playerWon && user.auth.currentUser?.uid !== gameData?.playerWon

  const [loadingMove, setLoadingMove] = useState(false);
  const onClickMove = (moveCol: number) => {
    setLoadingMove(true);
    user.playMove(gameId, moveCol)
      .finally(() => setLoadingMove(false))
  }

  return (
    <div className="game-root">
      {gameData && <>
        <div className = "game-info">
          <Typography>GameID: {gameId}</Typography>
          {playingAs &&
            <Typography>
              Playing as {playingAs === "R" ? "Red" : "Yellow"}. 
              {!gameData.playerY ? " Waiting for player..." : null}
              {gameData.playerY && playerTurn ? " Your turn!" : null}
              {playerWon ? " You WON!!!!!" : null}
              {playerLost ? " You Lost :(" : null}
              {gameData.draw ? " Draw" : null}
            </Typography>}
        </div>
        <div className="game-board">
          {Array.from({length: NUM_COL}).map((_,col) => (
            <GameCol 
              key={col} 
              playerTurn={playerTurn}
              onClick={playerTurn && !loadingMove ? () => onClickMove(col) : undefined}>
              {Array.from({length: NUM_ROW}).map((_,row) => (
                <GameCell cell={gameData.board[row][col]} key={row}/>
              )).reverse()}
            </GameCol>
          ))}
        </div>
      </>}
    </div>
  )
}