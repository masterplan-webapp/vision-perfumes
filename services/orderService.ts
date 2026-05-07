
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Order, CartItem, OrderStatus } from "../types";

const ORDERS_COLLECTION = "orders";

export const createOrder = async (
  userId: string,
  customerName: string,
  customerEmail: string,
  items: CartItem[],
  total: number,
  subtotal: number,
  discount: number,
  couponCode: string | undefined,
  shippingAddress: Order['shippingAddress'],
  customerDocument: string,
  customerPhone: string
): Promise<string> => {
  try {
    // Explicitly map items to ensure no circular references or DOM nodes are passed
    const cleanItems = items.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      selectedVariation: item.selectedVariation ? {
        id: item.selectedVariation.id,
        size: item.selectedVariation.size
      } : null
    }));

    const orderData: any = {
      userId,
      customerName,
      customerEmail,
      customerDocument,
      customerPhone,
      items: cleanItems,
      total,
      subtotal,
      discount,
      couponCode: couponCode || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      shippingAddress: { ...shippingAddress } // Shallow clone address
    };

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn("Could not fetch user orders (likely permission issue or not authenticated). Returning empty list.");
    return [];
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.warn("Could not fetch all orders (likely permission issue). Returning empty list.");
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingCode?: string): Promise<void> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const updates: any = { status };
    if (trackingCode) {
        updates.trackingCode = trackingCode;
    }
    await updateDoc(orderRef, updates);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const cancelOrder = async (orderId: string): Promise<void> => {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
            const orderData = orderSnap.data() as Order;
            if (orderData.status === 'pending') {
                await updateDoc(orderRef, { status: 'cancelled' });
            } else {
                throw new Error("Apenas pedidos pendentes podem ser cancelados.");
            }
        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
    }
};
