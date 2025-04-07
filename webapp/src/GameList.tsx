
import { useEffect, useState } from 'react';

import {Button} from '@mui/material'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';

import { GAME_LIST_PUBLIC, GamesListPublic } from "../../common/game-list";
import { User } from './firebase';

export const OpenGameList = ({user, setGameId}: {
  user:User,
  setGameId: (gameId:string) => any,
}) => {
  const [gameList, setGameList] = useState<GamesListPublic|undefined>();
  useEffect(() => user.subDoc(GAME_LIST_PUBLIC, setGameList), []);

  return (
    gameList ? <GameList gameList={gameList} title={"Open Games"} user={user} setGameId={setGameId} /> : null
  )
}

export const PlayerGameList = ({user, setGameId}: {
  user:User,
  setGameId: (gameId:string) => any,
}) => {
  const [gameList, setGameList] = useState<GamesListPublic|undefined>();
  useEffect(() => {
    user.getOpenPlayerGames()
      .then(list => list && setGameList(list))
  }, []);
  return gameList ? <GameList gameList={gameList} title={"Your Open Games"} user={user} setGameId={setGameId} /> : null
}

export const GameList = ({gameList, title, user, setGameId}: {
  gameList: GamesListPublic,
  title: string,
  user:User,
  setGameId: (gameId:string) => any
}) => {

  const [loadingJoin, setLoadingJoin] = useState(false);
  const onJoinGame = (joinId:string) => {
    setLoadingJoin(true);
    user?.joinGame(joinId)
      .then(() => setGameId(joinId))
      .finally(() => {setLoadingJoin(false)})
  };

  const entries = Object.entries(gameList.list||{});

  return entries.length ? (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>{title}</TableCell>
            <TableCell>Started</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(([gameId, createdAt]) => (
            <TableRow
              key={gameId}
              sx={{'&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">{gameId}</TableCell>
              <TableCell>{
                String(createdAt.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }))
              }</TableCell>
              <TableCell align="right">
                <Button 
                  variant="outlined"
                  onClick={() => onJoinGame(gameId)}
                  loading={loadingJoin}
                  loadingPosition="start"
                  startIcon={<VideogameAssetIcon />}
                  disabled={false}>
                  Join
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : null;
}