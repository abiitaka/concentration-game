import firebase from 'firebase/app';
import "firebase/app";
import "firebase/auth";
import "firebase/firestore"
import firebaseConfig from './config';

const firebaseApp = firebase.initializeApp(firebaseConfig);

export const firebaseAuth = firebaseApp.auth();
export const firebaseDb = firebaseApp.firestore();
