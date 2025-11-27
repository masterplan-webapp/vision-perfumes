
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { getUserProfile, toggleWishlistItem } from '../services/userService';
import { PRODUCTS } from '../constants';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlist: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  loading: boolean;
  setCatalog: (products: Product[]) => void; // Nova função para atualizar o catálogo
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS); // Estado para armazenar todos os produtos
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount/user change
  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true);
      if (user) {
        // Load from Firestore
        const profile = await getUserProfile(user.uid);
        if (profile && profile.wishlist) {
          setWishlistIds(profile.wishlist);
        } else {
          setWishlistIds([]);
        }
      } else {
        // Load from LocalStorage for guests
        const local = localStorage.getItem('vision_guest_wishlist');
        if (local) {
          try {
            setWishlistIds(JSON.parse(local));
          } catch (e) {
            setWishlistIds([]);
          }
        } else {
          setWishlistIds([]);
        }
      }
      setLoading(false);
    };

    loadWishlist();
  }, [user]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const exists = wishlistIds.includes(product.id);
    let newIds: string[];

    if (exists) {
      newIds = wishlistIds.filter(id => id !== product.id);
      addToast('Removido da Lista de Desejos', 'info');
    } else {
      newIds = [...wishlistIds, product.id];
      addToast('Adicionado à Lista de Desejos', 'success');
    }

    setWishlistIds(newIds);

    if (user) {
      // Sync with Firestore
      await toggleWishlistItem(user.uid, product.id, !exists);
    } else {
      // Sync with LocalStorage
      localStorage.setItem('vision_guest_wishlist', JSON.stringify(newIds));
    }
  }, [wishlistIds, user, addToast]);

  // Resolve full product objects from IDs using the dynamic catalog
  // Agora filtramos do 'catalog' (que contém produtos do banco) e não apenas de 'PRODUCTS'
  const wishlistProducts = catalog.filter(p => wishlistIds.includes(p.id));

  return (
    <WishlistContext.Provider value={{ wishlist: wishlistProducts, isInWishlist, toggleWishlist, loading, setCatalog }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
