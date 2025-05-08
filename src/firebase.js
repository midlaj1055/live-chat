import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBfnz1th3dUb99EXGuHtf8PUItIc9mRG8A",
  authDomain: "livechat-77daf.firebaseapp.com",
  projectId: "livechat-77daf",
  storageBucket: "livechat-77daf.firebasestorage.app",
  messagingSenderId: "795935983635",
  appId: "1:795935983635:web:9903971a63fc74a97c57e6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  db,
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
};
