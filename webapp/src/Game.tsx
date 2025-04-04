import "./Game.css"
import { useState } from "react";
import { User } from "./firebase"
import { CellState, Connect4Game, NUM_COL, NUM_ROW } from "../../types/connect4";

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import AddCircle from '@mui/icons-material/AddCircle';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';


export const Game = (args: {user: User}) => {
  const {user} = args;

  const [loadingNew, setLoadingNew] = useState(false);
  const onNewGame = () => {
    setLoadingNew(true)
    user.createGame()
      .then(({gameId}) => {
        setGameId(gameId);
        const unsub = user.subGame(gameId, (gameData) => setGameData(gameData));
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
  const onJoinGame = () => {
    setLoadingJoin(true);
    user.joinGame(joinId)
      .then(() => {
        setGameId(joinId);
        const unsub = user.subGame(gameId, (gameData) => setGameData(gameData));
      })
  };

  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState<Connect4Game|null>(null);
  const playingAs: CellState = 
    user.auth.currentUser?.uid === gameData?.playerR ? 'R' :
      user.auth.currentUser?.uid === gameData?.playerY ? 'Y' :
        "";

  return (<>
    {gameData && <>
      <div className = "info-div">
        <Typography>GameID: {gameId}</Typography>
        {playingAs &&
          <Typography>Playing as {playingAs === "R" ? "Red" : "Yellow"}</Typography>}

      </div>
      <div className = "game-div">
          
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
      <div className="gameid-div">
        <Button 
          variant="contained"
          onClick={onJoinGame}
          loading={loadingJoin}
          loadingPosition="start"
          startIcon={<VideogameAssetIcon />}
          disabled={false}>
          Join
        </Button>
        <div className="gameid-text-div">
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
  </>)
}