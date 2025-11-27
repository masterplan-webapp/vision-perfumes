
import { collection, getDocs, doc, setDoc, writeBatch, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Product } from "../types";
import { PRODUCTS } from "../constants";

const PRODUCTS_COLLECTION = "products";

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    
    // If database is empty, seed it with constants
    if (querySnapshot.empty) {
      // Try to seed, but if it fails (due to permissions), just ignore
      try {
        await seedProducts();
      } catch (e) {
        console.log("Seeding skipped due to permissions.");
      }
      return PRODUCTS;
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error) {
    console.warn("Firestore access restricted or failed. Using static product data fallback.", error);
    // Fallback to static data if DB is locked or unreachable
    return PRODUCTS;
  }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), product);
    return { id: docRef.id, ...product };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    
    // CRITICAL: Remove 'id' from the payload to prevent it from being written as a field inside the document.
    // Firestore stores the ID in metadata, duplication inside the doc can cause issues with strict rules.
    const { id: _, ...cleanUpdates } = updates;

    // Using setDoc with merge: true covers both updates and creation of missing static records.
    await setDoc(docRef, cleanUpdates, { merge: true });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

const seedProducts = async () => {
  const batch = writeBatch(db);
  
  PRODUCTS.forEach((product) => {
    // Separate ID from data for cleaner storage
    const { id, ...data } = product;
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    batch.set(docRef, data);
  });

  await batch.commit();
};
