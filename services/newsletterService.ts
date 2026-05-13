
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const subscribeToNewsletter = async (email: string) => {
  try {
    // Check if already subscribed
    const q = query(collection(db, 'newsletter'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: true, message: 'Você já está inscrito!' };
    }

    // Add new subscription
    await addDoc(collection(db, 'newsletter'), {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
      active: true
    });

    return { success: true, message: 'Inscrição realizada com sucesso!' };
  } catch (error) {
    console.error('Newsletter error:', error);
    throw error;
  }
};
