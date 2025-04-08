/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, onRequest} from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";

import dayjs from "./djs";
import { db, logger } from './include'
import * as Require from './require';
import * as Err from './err';
import { NUM_ROW, NUM_COL, CellState, Connect4Game, findMoveRow, GAMES_PATH, BoardState, findWin } from "../../common/connect4";
import { GAME_LIST_EVENTS, GAME_LIST_EVENT_TRIGGER, GameListEventTrigger, GameListEvent, GAME_LIST_PUBLIC } from "../../common/game-list";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true})
  response.send("Hello from Firebase!")
});

const checkAuth = onCall(async (req, rsp) => {
  const uid = Require.auth(req);
  return {uid};
});

// ** GAME LIST ** //

const triggerRef = db.doc(GAME_LIST_EVENT_TRIGGER);

/**
 * Update the game list document
 * 
 * Adds the game list update event to the game list event collection
 * 
 * If necessary, triggers the 10s processing loop
 * 
 * @param gameId game id
 * @param type type of event
 * @returns 
 */
const updateGameListEvent = async (gameId: string, type: GameListEvent['type']) => {
  const now = Timestamp.now();

  const event: GameListEvent = {
    createdAt: now,
    gameId,
    type,
  };
  await db.collection(GAME_LIST_EVENTS).add(event);

  const runUntil = dayjs().ceil('seconds', 10);
  const triggerDoc = await db.doc(GAME_LIST_EVENT_TRIGGER).get()
  // create trigger doc if doesn't exist
  if (!triggerDoc.exists) {
    return db.runTransaction(async txn => 
      txn.create(triggerRef, {lastRunUntil: runUntil.toStamp()} satisfies GameListEventTrigger))
      .catch(() => {}) // don't fail creation
  } 

  const {lastRunUntil} = triggerDoc.data() as GameListEventTrigger;

  // only take read-write lock if we're trying to update the trigger doc
  if (!lastRunUntil || runUntil.isAfter(lastRunUntil.toDate())) {
    return db.runTransaction(async txn => {
      const {lastRunUntil} = (await txn.get(triggerRef)).data() as GameListEventTrigger
      if (!lastRunUntil || runUntil.isAfter(lastRunUntil.toDate())) {
        txn.set(triggerRef, {lastRunUntil: runUntil.toStamp()} satisfies GameListEventTrigger)
      }
    })
  }
}

const gameListRef = db.doc(GAME_LIST_PUBLIC)
export const onProcessGameListEvents = onDocumentWritten(GAME_LIST_EVENT_TRIGGER, async (snapshot) => {
  const {lastRunUntil} = snapshot.data?.after.data() as GameListEventTrigger

  // processes event 1/sec until current run is over
  while (dayjs().isBefore(lastRunUntil.toDate())) {
      // get events sorted in ascending order
      const eventQuery = await db.collection(GAME_LIST_EVENTS).orderBy('createdAt','asc').get();

      const update = eventQuery.docs
        .map(d => d.data() as GameListEvent)
        .reduce((update, evt) => {
          const fieldPath = evt.gameId;
    
          if (evt.type === 'ADD') {
            update[fieldPath] = evt.createdAt;
    
          } else if (evt.type === 'DELETE') {
            if (update[fieldPath])
              // if ADD was processed this read, just delete the ADD
              delete update[fieldPath]
            else
              // otherwise delete the field from the listing
              update[fieldPath] = FieldValue.delete();
          }
          return update;
        }, {} as {[gameId:string]: Timestamp|FieldValue})
      
      logger.info(update);
    
      // create update mapping
      await gameListRef.set({list: update}, {merge: true});
    
      // delete events
      await Promise.all(eventQuery.docs.map(d => d.ref.delete()));
    
      // wait a second
      await new Promise(resolve => setTimeout(resolve, 1000));
  }
})

// ** GAME FUNCTIONS ** //


const createGame = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);

  const board: BoardState = {};
  for (let row = 0; row < NUM_ROW; ++row) {
    board[row] = new Array(NUM_COL).fill('');
  }  

  const now = Timestamp.now()
  const gameData: Connect4Game = {
    board,
    playerR: uid,
    playerTurn: uid,
    playerWon: '',
    draw: false,
    createdAt: now,
    updatedAt: now,
  }
  console.log(gameData)
  const gameRef = await db.collection(GAMES_PATH).add(gameData);
  await updateGameListEvent(gameRef.id, 'ADD');
  return {gameId: gameRef.id}
});                                                   

const joinGame = onCall({cors:true}, async (req, rsp) => {
  const uid = Require.auth(req);
  const { gameId } = Require.args(req.data, ['gameId'])

  await db.runTransaction (async (txn) => {
    const {gameRef, game} = await Require.game(gameId, txn)
    if (uid === game.playerR || uid === game.playerY)
      return;

    await updateGameListEvent(gameId, 'DELETE');

    if (!game.playerR) {
      return txn.update(gameRef, {'playerR': uid} satisfies Partial<Connect4Game>)
    } else if (!game.playerY) {
      return txn.update(gameRef, {'playerY': uid} satisfies Partial<Connect4Game>)
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
    if (!game.playerY) { // delete if 2nd player never joined
      await updateGameListEvent(gameId, 'DELETE');
      return txn.delete(gameRef);
    }
    if (game.playerWon || game.draw) {
      return
    }

    if (game.playerR === uid) {
      return txn.update(gameRef, {playerWon: game.playerY} satisfies Partial<Connect4Game>)
    } else if (game.playerY === uid) {
      return txn.update(gameRef, {playerWon: game.playerR} satisfies Partial<Connect4Game>)
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
    
    if (game.playerWon)
      throw Err.failed('Game already won')
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

    // do win detection
    const foundWin = findWin(game.board, moveRow, moveCol) === playerVal

    const foundDraw = game.board[NUM_ROW-1].every(cell => cell !== '')

    const updateDoc: Partial<Connect4Game> = {
      // update game board
      board: game.board,
      // set next turn
      playerTurn: playerVal === 'R' ? game.playerY : game.playerR,
      // if win found, set playerWon
      ...foundWin && { 
        playerWon: uid,
        playerTurn: '',
      },
      ...foundDraw && {
        draw: true,
        playerTurn: '',
      },
      updatedAt: Timestamp.now()
    }
    return txn.update(gameRef, updateDoc);
  });
});

// ** GAME LIST ** //
/**
 * Clean public games list every min
 */
const gameTimeout = onSchedule("* * * * *", async () => {

})

export { helloWorld, checkAuth, createGame, joinGame, leaveGame, playMove }
