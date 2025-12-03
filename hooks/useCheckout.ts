'use client';

import { useState, useCallback } from 'react';
import { processPayment } from '@/services/pagarmeService';

// Define gtag type globally
declare global {
  interface Window {
    gtag?: (event: string, name: string, params: any) => void;
  }
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariation?: {
    price: number;
  };
}

export interface CheckoutFormData {
  cardNumber: string;
  holderName: string;
  expirationDate: string;
  cvv: string;
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
}

export interface CheckoutState {
  loading: boolean;
  error: string | null;
  success: boolean;
  transactionId: string | null;
  pixCode: string | null;
  pixQrCodeUrl: string | null;
  boletoBarcode: string | null;
  boletoUrl: string | null;
}

const initialState: CheckoutState = {
  loading: false,
  error: null,
  success: false,
  transactionId: null,
  pixCode: null,
  pixQrCodeUrl: null,
  boletoBarcode: null,
  boletoUrl: null,
};

export function useCheckout(items: CartItem[] = [], total: number = 0, user: any = null) {
  const [state, setState] = useState<CheckoutState>(initialState);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const processCheckout = useCallback(
    async (formData: CheckoutFormData, billingAddress: any) => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: 'You must be logged in to checkout',
        }));
        return;
      }

      if (items.length === 0) {
        setState((prev) => ({
          ...prev,
          error: 'Your cart is empty',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const result = await processPayment(
          total,
          formData.paymentMethod,
          {
            name: user.displayName || 'Customer',
            email: user.email || '',
            document: billingAddress.document || '',
            type: 'individual',
            phones: {
              mobile_phone: {
                country_code: '55',
                area_code: billingAddress.areaCode || '11',
                number: billingAddress.phone || '',
              },
            },
          },
          items,
          billingAddress,
          process.env.VITE_PAGARME_PUBLIC_KEY || '',
          formData.paymentMethod === 'credit_card'
            ? {
                number: formData.cardNumber,
                holderName: formData.holderName,
                expirationDate: formData.expirationDate,
                cvv: formData.cvv,
              }
            : undefined
        );

        if (result.success) {
          setState((prev) => ({
            ...prev,
            loading: false,
            success: true,
            transactionId: result.transactionId || null,
            pixCode: result.pixCode || null,
            pixQrCodeUrl: result.pixQrCodeUrl || null,
            boletoBarcode: result.boletoBarcode || null,
            boletoUrl: result.boletoUrl || null,
          }));

          // Track purchase event in GA4
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'purchase', {
              transaction_id: result.transactionId,
              value: total,
              currency: 'BRL',
              items: items.map((item: CartItem) => ({
                item_id: item.id,
                item_name: item.name,
                price: item.selectedVariation?.price || item.price,
                quantity: item.quantity,
              })),
            });
          }
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || 'Payment processing failed',
          }));
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'An error occurred during checkout',
        }));
      }
    },
    [items, total, user]
  );

  return {
    state,
    processCheckout,
    resetState,
  };
}
