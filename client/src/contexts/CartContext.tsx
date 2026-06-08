import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItemCustomization {
  title: string;
  value: string | number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;        // discounted price (or original if no discount)
  originalPrice?: number; // original price before discount, if applicable
  image: string;
  quantity: number;
  customizations?: CartItemCustomization[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_KEY = "narcissus-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      if (!item.customizations?.length) {
        const existing = prev.find(i => i.id === item.id && !i.customizations?.length);
        if (existing) {
          return prev.map(i =>
            i.id === item.id && !i.customizations?.length
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const getTotalPrice = useCallback(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const getTotalItems = useCallback(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}