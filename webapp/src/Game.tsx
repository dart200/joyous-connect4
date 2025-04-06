import "./Game.css"
import { useCallback, useState } from "react";
import { User } from "./firebase"
import { CellState, Connect4Game, NUM_COL, NUM_ROW } from "../../common/connect4";

import {alpha} from "@mui/material";
import Button from '@mui/material/Button';
import Box, { BoxProps } from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddCircle from '@mui/icons-material/AddCircle';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';

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

export const Game = (args: {user: User}) => {
  const {user} = args;

  const [loadingNew, setLoadingNew] = useState(false);
  const onNewGame = () => {
    setLoadingNew(true)
    user.createGame()
      .then(({gameId}) => {
        setGameId(gameId);
        user.subGame(gameId, (gameData) => setGameData(gameData));
      })
      .finally(() => {
        setLoadingNew(false);
      })
  }

  const [loadingJoin, setLoadingJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const onChangeJoinId = (evt: any) => {
    setJoinId(evt.target.value);
  }
  const onJoinGame = useCallback(() => {
    setLoadingJoin(true);
    user.joinGame(joinId)
      .then(() => {
        setGameId(joinId);
        user.subGame(joinId, (gameData) => setGameData(gameData));
      })
      .finally(() => {setLoadingJoin(false)})
  },[joinId, user]);

  const [loadingMove, setLoadingMove] = useState(false);
  const onClickMove = (moveCol: number) => {
    setLoadingMove(true);
    user.playMove(gameId, moveCol)
      .finally(() => setLoadingMove(false))
  }

  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState<Connect4Game|null>(null);
  const playingAs: CellState = 
    user.auth.currentUser?.uid === gameData?.playerR ? 'R' :
      user.auth.currentUser?.uid === gameData?.playerY ? 'Y' :
        "";

  const loading = loadingNew || loadingMove || loadingJoin;
  const playerTurn = user.auth.currentUser?.uid === gameData?.playerTurn;

  return (
    <div className="game-root">
      {gameData && <>
        <div className = "game-info">
          <Typography>GameID: {gameId}</Typography>
          {playingAs &&
            <Typography>
              Playing as {playingAs === "R" ? "Red" : "Yellow"}.
              {playerTurn ? "Your turn!" : null}
            </Typography>}
        </div>
        <div className="game-board">
          {Array.from({length: NUM_COL}).map((_,col) => (
            <GameCol 
              key={col} 
              playerTurn={playerTurn}
              onClick={playerTurn && !loading ? () => onClickMove(col) : undefined}>
              {Array.from({length: NUM_ROW}).map((_,row) => (
                <GameCell cell={gameData.board[row][col]} key={row}/>
              )).reverse()}
            </GameCol>
          ))}
        </div>
      </>}
      <div className="btns">
        <Button
          variant="contained"
          onClick={onNewGame}
          loading={loadingNew}
          loadingPosition="start"
          startIcon={<AddCircle />}
          disabled={false}>
          New Game
        </Button>
        <div className="gameid">
          <Button 
            variant="contained"
            onClick={onJoinGame}
            loading={loadingJoin}
            loadingPosition="start"
            startIcon={<VideogameAssetIcon />}
            disabled={false}>
            Join
          </Button>
          <TextField 
            fullWidth
            id="standard-basic"
            placeholder="Game ID"
            variant="standard"
            value={joinId}
            onChange={onChangeJoinId}/>
        </div>
      </div>
    </div>
  )
}