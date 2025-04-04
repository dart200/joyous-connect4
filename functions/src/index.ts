/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall,onRequest,HttpsError,CallableRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

export const adminApp = admin.initializeApp();
export const db       = adminApp.firestore();

const GAMES_PATH = 'games'

// example
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");

});

// ** BASIC UTIL ** //

const error = {
  auth: () => {throw new HttpsError('permission-denied', 'Invalid Authentication')}, 
  failed: (msg: string) => {throw new HttpsError('failed-precondition', msg)},
  arg: (msg: string) => {throw new HttpsError('invalid-argument', msg)},
};

/** require stuff */
const Require = {
  /** require certain args to exist, otherwise throw error */
  args: (args: {[id: string]: any}, reqArgs: string[]) => {
    for (const argName of reqArgs) {
      if (typeof args[argName] === 'undefined')
        throw error.arg('Missing arg: '+argName);
    }
    return args;
  },
  /** require auth to exist, otherwise throw error */
  auth: (context: CallableRequest) => {
    if (!context.auth)
      throw error.auth();
    return context.auth.uid;
  },
  /** require document to exist, otherwise throw error */
  doc: async (path: string, txn?: admin.firestore.Transaction) => {
    const ref = db.doc(path);
    const doc = await (txn ? txn?.get(ref) : ref.get());
    if (!doc.exists)
      throw error.failed('Missing doc: '+path);
    
    return {ref, doc};
  },
  /** require game to exist, otherwise throw error */
  game: (id: string, txn?: admin.firestore.Transaction) =>
    Require.doc(GAMES_PATH+'/'+id, txn)
      .then(({ref, doc}) => ({
        gameRef: ref,
        game: doc.data() as Connect4Game
      })),
};

// ** GAME UTIL ** //

const NUM_ROW = 6
const NUM_COL = 7

type CellState = '' | 'R' | 'Y';

// Based game data
interface Connect4Game {
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
type BoardState = Connect4Game["board"];

const findMoveRow = (board: BoardState, moveCol: number) => board
  .map(row => row[moveCol])
  .findIndex((val) => val === '')

// ** FUNCTIONS ** //

export const checkAuth = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  return {uid};
});

export const createGame = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  const gameData: Connect4Game = {
    board: new Array(NUM_ROW).fill(
      () => new Array(NUM_COL).fill("")
    ),
    playerR: uid,
    playerTurn: uid,
  }
  const gameDoc = await db.collection(GAMES_PATH).add(gameData);
  return {gameId: gameDoc.id};
});

export const joinGame = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId } = Require.args(req.data, ['gameId'])

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn);

    if (!game.playerR) {
      return txn.update(gameRef, {'playerR': uid})
    } else if (!game.playerY) {
      return txn.update(gameRef, {'playerY': uid})
    } else {
      throw error.failed("Game is full")
    }
  });
});

export const leaveGame = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId } = Require.args(req.data, ['gameId'])

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn);
    if (game.playerR === uid) {
      return txn.update(gameRef, {'playerR': ''})
    } else if (game.playerY === uid) {
      return txn.update(gameRef, {'playerY': ''})
    } else {
      throw error.failed('Player not in game')
    }
  });
});

export const doMove = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId, moveCol } = Require.args(req.data, ['gameId', 'move']);

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn);

    // check player turn
    if (game.playerTurn !== uid)
      throw error.failed('Not player\'s turn');
    const playerVal: CellState =
      game.playerR === uid ? 'R' :
        game.playerY === uid ? 'Y' :
          ''
    if (!playerVal)
      throw error.failed('Player not found?');

    if (moveCol < 0 || moveCol >= NUM_COL)
      throw error.arg(moveCol+' is not a valid row');

    // find move pos
    const moveRow = findMoveRow(game.board, moveCol);
    if (moveRow === -1)
      throw error.arg(moveCol+' is a full row');

    // update game board for win detection:
    game.board[moveCol][moveRow] = playerVal;

    // TODO win condition

    return gameRef.update({
      // update game board
      'board': game.board,
      // set next turn
      'playerTurn': playerVal === 'R' ? game.playerY : game.playerR
    });
  });
});