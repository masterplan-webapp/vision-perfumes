
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { CartItem } from "../types";

export const saveCartToFirebase = async (userId: string, cartItems: CartItem[]) => {
  try {
    // Fix: Avoid JSON.stringify to prevent circular reference errors.
    // Explicitly map the cart items to a clean object structure.
    const cleanCart = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      oldPrice: item.oldPrice || null,
      image: item.image,
      category: item.category,
      description: item.description,
      rating: item.rating,
      reviews: item.reviews,
      isNew: item.isNew || false,
      weight: item.weight || 0,
      dimensions: item.dimensions || null,
      quantity: item.quantity,
      selectedVariation: item.selectedVariation ? {
        id: item.selectedVariation.id,
        size: item.selectedVariation.size,
        price: item.selectedVariation.price,
        oldPrice: item.selectedVariation.oldPrice || null,
        stock: item.selectedVariation.stock || null,
        weight: item.selectedVariation.weight || null,
        dimensions: item.selectedVariation.dimensions || null
      } : null
    }));

    await setDoc(doc(db, "users", userId), {
      cart: cleanCart,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving cart:", error);
  }
};

export const getCartFromFirebase = async (userId: string): Promise<CartItem[]> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().cart) {
      return docSnap.data().cart as CartItem[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
};
