/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, onRequest} from "firebase-functions/v2/https";

import { db, logger } from './include'
import * as Require from './require';
import * as Err from './err';
import {NUM_ROW, NUM_COL, CellState, Connect4Game, findMoveRow, GAMES_PATH, BoardState} from "../../common/connect4";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true})
  response.send("Hello from Firebase!")
});

// ** GAME UTIL ** //

// ** FUNCTIONS ** //

const checkAuth = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  return {uid};
});

const createGame = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);

  const board: BoardState = {};
  for (let row = 0; row < NUM_ROW; ++row) {
    board[row] = new Array(NUM_COL).fill('');
  }  

  const gameData: Connect4Game = {
    board,
    playerR: uid,
    playerTurn: uid,
  }
  console.log(gameData)
  const gameRef = await db.collection(GAMES_PATH).add(gameData)
  return {gameId: gameRef.id}
});

const joinGame = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId } = Require.args(req.data, ['gameId'])

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn)
    if (uid === game.playerR || uid === game.playerY)
      return;

    if (!game.playerR) {
      return txn.update(gameRef, {'playerR': uid})
    } else if (!game.playerY) {
      return txn.update(gameRef, {'playerY': uid})
    } else {
      throw Err.failed("Game is full")
    }
  })
})

const leaveGame = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId } = Require.args(req.data, ['gameId'])

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn);
    if (game.playerR === uid) {
      return txn.update(gameRef, {'playerR': ''})
    } else if (game.playerY === uid) {
      return txn.update(gameRef, {'playerY': ''})
    } else {
      throw Err.failed('Player not in game')
    }
  });
});

const playMove = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId, moveCol } = Require.args(req.data, ['gameId', 'moveCol']);

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn);
    
    if (!game.playerR || !game.playerY)
      throw Err.failed('Need both players for turn')
    // check player turn
    if (game.playerTurn !== uid)
      throw Err.failed('Not player\'s turn');
    const playerVal: CellState =
      game.playerR === uid ? 'R' :
        game.playerY === uid ? 'Y' :
          ''
    if (!playerVal)
      throw Err.failed('Player not found?');

    if (moveCol < 0 || moveCol >= NUM_COL)
      throw Err.arg(moveCol+' is not a valid row');

    // find move pos
    const moveRow = findMoveRow(game.board, moveCol);
    if (moveRow === -1)
      throw Err.arg(moveCol+' is a full row');
    console.log('found move', {moveRow, moveCol})

    // update game board for win detection:
    game.board[moveRow][moveCol] = playerVal;

    console.log(game.board)

    // TODO win condition

    // why can't you just do this??
    //    return gameRef.update({

    return txn.update(gameRef, {
      // update game board
      'board': game.board,
      // set next turn
      'playerTurn': playerVal === 'R' ? game.playerY : game.playerR
    });
  });
});

export { helloWorld, checkAuth, createGame, joinGame, leaveGame, playMove }
