import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from "firebase-functions/logger";
initializeApp();
const db = getFirestore();

export {db,logger}