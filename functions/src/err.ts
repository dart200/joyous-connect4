import {onCall, onRequest, HttpsError, CallableRequest} from "firebase-functions/v2/https";

const auth = () => {throw new HttpsError('permission-denied', 'Invalid Authentication')} 
const failed = (msg: string) => {throw new HttpsError('failed-precondition', msg)}
const arg = (msg: string) => {throw new HttpsError('invalid-argument', msg)}

export {auth, failed, arg}