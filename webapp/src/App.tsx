import {useState, useEffect} from 'react'

import {CircularProgress, Typography, Button, TextField} from '@mui/material'
import {createTheme, ThemeProvider} from '@mui/material/styles';
import AddCircle from '@mui/icons-material/AddCircle';
import RemoveCircle from '@mui/icons-material/RemoveCircle';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';

import './App.css'

import { User } from './firebase';
// import { GameList } from './Gamelist';
import { Game } from './Game';
import { OpenGameList, PlayerGameList } from './GameList';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const App = () => {
  const [user, setUser] = useState<User|null>(null);
  useEffect(() => {
    const loadUser = async () => {
      const u = new User('user');
      await u.authInit;
      setUser(u);
    }
    if (!user)
      loadUser();
  }, [user])

  const [gameId, setGameId] = useState('');
  const [loadingNew, setLoadingNew] = useState(false);
  const onNewGame = () => {
    setLoadingNew(true)
    user?.createGame()
      .then(({gameId}) => setGameId(gameId))
      .finally(() => setLoadingNew(false))
  }

  const [joinId, setJoinId] = useState('');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const onChangeJoinId = (evt: any) => {
    setJoinId(evt.target.value);
  }
  const onJoinGame = () => {
    setLoadingJoin(true);
    user?.joinGame(joinId)
      .then(() => setGameId(joinId))
      .finally(() => {setLoadingJoin(false)})
  };

  const onLeaveGame = () => {
    setGameId("");
  }
     
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="root">
        <div className="app-page">
          {!user ? <CircularProgress /> : <>
            {gameId ? (
              <Game user={user} gameId={gameId}/> 
            ) : (<>
              <PlayerGameList user={user} setGameId={setGameId}/>
              <OpenGameList user={user} setGameId={setGameId}/>
            </>)}
            <div className="div-col">
              <div className="div-row">
                {gameId && <Button
                  variant="contained"
                  onClick={onLeaveGame}
                  loading={loadingNew}
                  loadingPosition="start"
                  startIcon={<RemoveCircle />}
                  disabled={false}>
                  Leave Game
                </Button>}
                <Button
                  variant="contained"
                  onClick={onNewGame}
                  loading={loadingNew}
                  loadingPosition="start"
                  startIcon={<AddCircle />}
                  disabled={false}>
                  New Game
                </Button>
              </div>
              <div className="div-row">
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
            <Typography className="user-id">UserID: {user?.u?.uid}</Typography>
           </>}
        </div>
      </div>
    </ThemeProvider>
  );
}
