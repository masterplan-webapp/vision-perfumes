
import "dotenv/config";
import * as firebaseApp from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "vision-perfumes.firebaseapp.com",
  projectId: "vision-perfumes",
  storageBucket: "vision-perfumes.firebasestorage.app",
  messagingSenderId: "115132444742",
  appId: "1:115132444742:web:7cbcafabca3ee6985a9a47",
  measurementId: "G-CWN378PZ6Q"
};

const app = firebaseApp.initializeApp(firebaseConfig);
const db = getFirestore(app);

const checkProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(JSON.stringify(products, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error fetching products:", error);
    process.exit(1);
  }
};

checkProducts();
