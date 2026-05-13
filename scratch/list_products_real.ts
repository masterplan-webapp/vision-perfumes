
import "dotenv/config";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

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
