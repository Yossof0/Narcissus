import { useState, useEffect, useCallback } from "react";

export interface CartItemCustomization {
  title: string;
  value: string | number;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  customizations?: CartItemCustomization[];
}

const CART_STORAGE_KEY = "narcissus-cart";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, isLoading]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prevCart) => {
      // Items with customizations are always added as new line items
      if (item.customizations && item.customizations.length > 0) {
        return [...prevCart, item];
      }
      const existing = prevCart.find(i => i.id === item.id && !i.customizations?.length);
      if (existing) {
        return prevCart.map(i => i.id === item.id && !i.customizations?.length
          ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prevCart, item];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(index); return; }
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);
  const getTotalPrice = useCallback(() => cart.reduce((t, i) => t + i.price * i.quantity, 0), [cart]);
  const getTotalItems = useCallback(() => cart.reduce((t, i) => t + i.quantity, 0), [cart]);

  return { cart, isLoading, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems };
}