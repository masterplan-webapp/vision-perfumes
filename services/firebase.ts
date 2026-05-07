import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDHZpR1Rs6e-LHIyUA7Nye4McC366kMe_U",
  authDomain: "vision-perfumes.firebaseapp.com",
  projectId: "vision-perfumes",
  storageBucket: "vision-perfumes.firebasestorage.app",
  messagingSenderId: "115132444742",
  appId: "1:115132444742:web:7cbcafabca3ee6985a9a47",
  measurementId: "G-CWN378PZ6Q"
};

// Use namespace import access for initializeApp
const app = firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);