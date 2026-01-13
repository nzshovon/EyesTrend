
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyANPMWVzjcJGmyLn4ruczouEN1YnIoj2d8",
  authDomain: "eid-game-63ed1.firebaseapp.com",
  databaseURL: "https://eid-game-63ed1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eid-game-63ed1",
  storageBucket: "eid-game-63ed1.firebasestorage.app",
  messagingSenderId: "1037771062052",
  appId: "1:1037771062052:web:14999a41f44ddcf57e91b1",
  measurementId: "G-CQ9XT9QQ8E"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const dbRef = (path: string) => ref(db, path);
