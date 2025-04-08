import dayjs from 'dayjs';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as logger from "firebase-functions/logger";
initializeApp();
const db = getFirestore();

export {dayjs,db,logger,Timestamp}