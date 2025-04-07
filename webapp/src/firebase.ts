/* eslint-disable @typescript-eslint/no-explicit-any */

import {FirebaseApp, initializeApp} from 'firebase/app';
import {Auth, getAuth, connectAuthEmulator, signInAnonymously} from 'firebase/auth';
import {Functions, getFunctions, connectFunctionsEmulator, httpsCallable} from 'firebase/functions';
import {Firestore, getFirestore, connectFirestoreEmulator, doc, onSnapshot, query, collection, where, or, and, getDocs,} from 'firebase/firestore';

import firebaseJson from '../../firebase.json';
import { Connect4Game, GAMES_PATH } from '../../common/connect4';
import { GAME_LIST_PUBLIC, GamesListPublic } from '../../common/game-list';

const firebaseConfig = {
  apiKey: "AIzaSyByIeHloNs8ZUSuGUKReoA1JRH6tC0S86I",
  authDomain: "joyous-connect4.firebaseapp.com",
  projectId: "joyous-connect4",
  storageBucket: "joyous-connect4.firebasestorage.app",
  messagingSenderId: "633738472521",
  appId: "1:633738472521:web:190c838b32d7071f302398",
  measurementId: "G-78J9MPD0K7"
};

// more like connection rather than user
export class User {
  app: FirebaseApp;
  db: Firestore;
  functions: Functions;

  auth: Auth;
  get u() {return this.auth.currentUser};
  authInit: Promise<any>;

  constructor(name:string, emulator = process.env.NODE_ENV === 'development') {    
    this.app = initializeApp(firebaseConfig, name);
    this.db = getFirestore(this.app);
    this.functions = getFunctions(this.app);
    this.auth = getAuth(this.app);
  
    if (emulator) {
      connectFirestoreEmulator(this.db, 'localhost', firebaseJson.emulators.firestore.port);
      connectFunctionsEmulator(this.functions, 'localhost', firebaseJson.emulators.functions.port);
      connectAuthEmulator(this.auth, 'http://localhost:'+firebaseJson.emulators.auth.port, {disableWarnings: true});
    };

    this.authInit = new Promise(resolve => {
      this.auth.onAuthStateChanged(async user => {
        if (!user) await signInAnonymously(this.auth)
          .catch(() => resolve(false));
        resolve(true);
      });
    });
  };

  subDoc<DataType> (path: string, updateFn: (data: DataType) => any) {
    const docRef = doc(this.db, path);
    return onSnapshot(docRef, doc => updateFn(doc.data() as DataType))
  }

  async getOpenPlayerGames () {
    if (!this.u?.uid) return

    const games = collection(this.db, GAMES_PATH);
    const q = query(games,
      and(
        or(where('playerR', '==', this.u?.uid), where('playerY', '==', this.u?.uid)),
        or(where('playerWon', '==', ''), where('draw', '==', false))
      )
    )
    
    const docs = await getDocs(q)
    const list =  docs.docs.reduce((list, doc) => {
      const data: Connect4Game = doc.data() as Connect4Game;
      list[doc.id] = data.createdAt;
      return list;
    }, {} as GamesListPublic['list'])

    return {list}
  };

  cloudFunc = (name:string, args?:{}) => 
    httpsCallable(this.functions, name)(args)
      .then(res => res.data as any)

  checkAuth = () => this.cloudFunc('checkAuth');
  createGame = () => this.cloudFunc('createGame').then(data => data as {gameId: string});
  joinGame = (gameId: string) => this.cloudFunc('joinGame', {gameId});
  playMove = (gameId: string, moveCol: number) => this.cloudFunc('playMove', {gameId, moveCol});
};