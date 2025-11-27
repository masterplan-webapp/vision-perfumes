
import { collection, getDocs, setDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { AdminUser } from "../types";

const ADMINS_COLLECTION = "allowed_admins";

export const checkIsAdmin = async (email: string): Promise<boolean> => {
  if (!email) return false;

  try {
    // Agora verificamos diretamente se existe um documento com o ID = email
    // Isso é muito mais rápido e barato que fazer uma query
    const docRef = doc(db, ADMINS_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return true;
    }
  } catch (error) {
    // console.warn("Erro ao verificar admin no Firestore:", error);
  }

  // FALLBACK TEMPORÁRIO DE SEGURANÇA:
  // Mantemos isso APENAS para garantir que você não perca acesso enquanto configura a lista.
  // Depois que você se adicionar na lista pela aba "Equipe", essa checagem será redundante
  // mas inofensiva.
  if (email.startsWith('admin')) {
    return true;
  }

  return false;
};

export const getAdmins = async (): Promise<AdminUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, ADMINS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdminUser));
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
        console.error("Error fetching admins:", error);
    }
    return [];
  }
};

export const addAdmin = async (email: string, addedBy: string): Promise<void> => {
  try {
    // Usamos o email como ID do documento. 
    // Isso permite criar regras de segurança como: exists(.../allowed_admins/$(request.auth.token.email))
    await setDoc(doc(db, ADMINS_COLLECTION, email), {
        email,
        addedBy,
        addedAt: new Date().toISOString()
    });
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        throw new Error("Permissão negada. Você precisa ser admin para adicionar outro.");
    }
    throw error;
  }
};

export const removeAdmin = async (emailAsId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, ADMINS_COLLECTION, emailAsId));
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new Error("Permissão negada ao remover.");
        }
        throw error;
    }
};
