
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, Address } from "../types";

const USERS_COLLECTION = "users";

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: userId, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    
    // Sanitize data to remove undefined values
    const cleanData = JSON.parse(JSON.stringify(data));
    
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const toggleWishlistItem = async (userId: string, productId: string, isAdding: boolean) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    
    if (isAdding) {
      await setDoc(docRef, {
        wishlist: arrayUnion(productId)
      }, { merge: true });
    } else {
      await updateDoc(docRef, {
        wishlist: arrayRemove(productId)
      });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
  }
};