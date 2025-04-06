/* eslint-disable @typescript-eslint/no-explicit-any */

import {FirebaseApp, initializeApp} from 'firebase/app';
import {Auth, getAuth, connectAuthEmulator, signInAnonymously} from 'firebase/auth';
import {Functions, getFunctions, connectFunctionsEmulator, httpsCallable} from 'firebase/functions';
import {Firestore, getFirestore, connectFirestoreEmulator, doc, onSnapshot} from 'firebase/firestore';

import firebaseJson from '../../firebase.json';
import { Connect4Game, GAMES_PATH } from '../../common/connect4';

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

  unsubGame?: () => any;

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
          .catch(err => resolve(false));
        resolve(true);
      });
    });
  };

  subGame = (id: string, func: (game: Connect4Game) => any) => {
    console.log("subbing game", id)
    if (this.unsubGame)
      this.unsubGame();
    const gameDoc = doc(this.db, GAMES_PATH+'/'+id);
    this.unsubGame = onSnapshot(gameDoc, doc => {
      const data = doc.data();
      func(data as Connect4Game);
    });
  };

  cloudFunc = (name:string, args?:{}) => 
    httpsCallable(this.functions, name)(args)
      .then(res => res.data as any)

  checkAuth = () => this.cloudFunc('checkAuth');
  createGame = () => this.cloudFunc('createGame').then(data => data as {gameId: string});
  joinGame = (gameId: string) => this.cloudFunc('joinGame', {gameId});
  playMove = (gameId: string, moveCol: number) => this.cloudFunc('playMove', {gameId, moveCol});
};