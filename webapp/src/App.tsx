import {useState, useEffect} from 'react'
import {CircularProgress, Typography} from '@mui/material'
import {createTheme, ThemeProvider} from '@mui/material/styles';
import './App.css'
import { GameList } from './Gamelist';
import { Game } from './Game';
import { User } from './firebase';

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

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="root">
        <div className="app-page">
          {!user ? 
            <CircularProgress />
           : <>
            <Game user={user}/>
           </>}
        </div>
        <Typography className="user-id">UserID: {user?.u?.uid}</Typography>
      </div>
    </ThemeProvider>
  );
}
