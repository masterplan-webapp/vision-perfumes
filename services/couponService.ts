import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, increment } from "firebase/firestore";
import { db } from "./firebase";
import { Coupon } from "../types";

const COUPONS_COLLECTION = "coupons";

export const createCoupon = async (coupon: Omit<Coupon, 'id' | 'usageCount'>) => {
  try {
    // Verifica se o código já existe
    const q = query(collection(db, COUPONS_COLLECTION), where("code", "==", coupon.code));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
        throw new Error("Já existe um cupom com este código.");
    }

    // Prepare data removing undefined values
    const couponData = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      isActive: coupon.isActive,
      minPurchase: coupon.minPurchase || null,
      usageLimit: coupon.usageLimit || null,
      expirationDate: coupon.expirationDate || null,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, COUPONS_COLLECTION), couponData);
  } catch (error) {
    console.error("Error creating coupon:", error);
    throw error;
  }
};

export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COUPONS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Coupon));
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};

export const deleteCoupon = async (id: string) => {
  try {
    await deleteDoc(doc(db, COUPONS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting coupon:", error);
    throw error;
  }
};

export const validateCoupon = async (code: string, subtotal: number): Promise<{ isValid: boolean, discount: number, message: string, coupon?: Coupon }> => {
  try {
    const q = query(collection(db, COUPONS_COLLECTION), where("code", "==", code), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { isValid: false, discount: 0, message: "Cupom inválido ou não encontrado." };
    }

    const coupon = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Coupon;

    // Validações
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
        return { isValid: false, discount: 0, message: "Este cupom expirou." };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { isValid: false, discount: 0, message: "Este cupom atingiu o limite de usos." };
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        return { isValid: false, discount: 0, message: `Valor mínimo para este cupom: R$ ${coupon.minPurchase}` };
    }

    // Cálculo do desconto
    let discountAmount = 0;
    if (coupon.type === 'percent') {
        discountAmount = (subtotal * coupon.value) / 100;
    } else {
        discountAmount = coupon.value;
    }

    // Garantir que o desconto não seja maior que o subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return { isValid: true, discount: discountAmount, message: "Cupom aplicado!", coupon };

  } catch (error) {
    console.error("Error validating coupon:", error);
    return { isValid: false, discount: 0, message: "Erro ao validar cupom." };
  }
};

export const incrementCouponUsage = async (couponId: string) => {
    try {
        const couponRef = doc(db, COUPONS_COLLECTION, couponId);
        await updateDoc(couponRef, {
            usageCount: increment(1)
        });
    } catch (error) {
        console.error("Error incrementing coupon usage:", error);
    }
};