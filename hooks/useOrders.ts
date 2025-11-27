


import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { getUserOrders, getAllOrders, updateOrderStatus, cancelOrder } from '../services/orderService';
import { sendOrderStatusEmail } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useUserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserOrders(user.uid);
      setOrders(data);
    } catch (err) {
      setError("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refreshOrders: fetchOrders };
};

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, refreshOrders: fetchOrders };
};

export const useOrderActions = (refreshCallback?: () => void) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, trackingCode?: string) => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus, trackingCode);
      
      // Try to find order details locally (simple mock, ideally we fetch the order)
      // Since we are likely inside a component that has the order list, we should pass the full order,
      // but to keep the hook signature simple we will just fetch it or create a partial object if needed.
      // NOTE: In a real app, 'updateOrderStatus' might trigger a cloud function to send email.
      // Here we simulate the frontend triggering the email request.
      
      // We need the order details (customer email/name) to send the notification
      // This is a limitation of client-side-only triggers. 
      // Workaround: We will fetch the order again just to get the email.
      const orders = await getAllOrders(); // Or fetch single order
      const targetOrder = orders.find(o => o.id === orderId);
      
      if (targetOrder) {
        await sendOrderStatusEmail(targetOrder, newStatus, trackingCode);
      }

      if (refreshCallback) refreshCallback();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar status ou enviar email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar este pedido?")) return;
    
    setLoading(true);
    try {
      await cancelOrder(orderId);
      
      // Send cancellation email
      const orders = await getAllOrders();
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        await sendOrderStatusEmail(targetOrder, 'cancelled');
      }

      if (refreshCallback) refreshCallback();
    } catch (error) {
      alert("Erro ao cancelar pedido.");
    } finally {
      setLoading(false);
    }
  };

  return { handleStatusChange, handleCancel, loading };
};
