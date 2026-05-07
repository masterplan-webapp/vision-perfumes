
import { Order } from "../types";

// Note: Email notifications are now handled by Cloud Functions (backend) 
// using Firestore Triggers and Resend SDK for better security and reliability.

export const sendOrderConfirmationEmail = async (order: Order) => {
  console.log("Order confirmation email logic moved to backend.");
};

export const sendAdminNewOrderEmail = async (order: Order) => {
  console.log("Admin notification email logic moved to backend.");
};

export const sendOrderStatusEmail = async (order: Order, newStatus: string, trackingCode?: string) => {
  console.log("Order status email logic moved to backend.");
};
