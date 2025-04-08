import { Timestamp } from "include";

export const GAME_LIST_PUBLIC = 'public/game-list';
export const GAME_LIST_EVENT_TRIGGER = 'admin/game-list';
export const GAME_LIST_EVENTS = 'admin/game-list/events';

export interface GamesListPublic {
  // list of open games
  list: {
    [gameId:string]: Timestamp
  }
}

export interface GameListEventTrigger {
  lastRunUntil: Timestamp
}

export interface GameListEvent {
  createdAt: Timestamp;
  gameId: string;
  type: 'ADD' | 'DELETE';
}

