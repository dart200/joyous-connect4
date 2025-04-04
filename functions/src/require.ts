import {onCall, onRequest, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import { getFirestore, Timestamp, FieldValue, Filter, Transaction } from 'firebase-admin/firestore';

import { db, logger } from './include';
import * as Err from './err'
import {NUM_ROW, NUM_COL, CellState, Connect4Game, BoardState, GAMES_PATH} from "../../common/connect4";

  /** require certain args to exist, otherwise throw error */
  const args = (args: {[id: string]: any}, reqArgs: string[]) => {
    logger.info(args);
    for (const argName of reqArgs) {
      if (typeof args[argName] === 'undefined')
        throw Err.arg('Missing arg: '+argName);
    }
    return args;
  };
  /** require auth to exist, otherwise throw error */
  const auth = (context: CallableRequest) => {
    if (!context.auth)
      throw Err.auth();
    return context.auth.uid;
  };
  /** require document to exist, otherwise throw error */
  const doc = async (path: string, txn?: Transaction) => {
    const ref = db.doc(path);
    const doc = await (txn ? txn?.get(ref) : ref.get());
    if (!doc.exists)
      throw Err.failed('Missing doc: '+path);
    
    return {ref, doc};
  };
  /** require game to exist, otherwise throw error */
  const game = (id: string, txn?: Transaction) =>
    doc(GAMES_PATH+'/'+id, txn)
      .then(({ref, doc}) => ({
        gameRef: ref,
        game: doc.data() as Connect4Game
      }));

export {args, auth, doc, game}