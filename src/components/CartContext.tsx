// src/components/CartContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  priceCents: number;
  sellerId: string;
  sellerUsername: string;
  imageUrl: string | null;
};

type CartContextType = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
});
export const useCart = () => useContext(CartContext);

export default function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("herd-cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("herd-cart", JSON.stringify(items));
  }, [items]);

  function add(item: CartItem) {
    setItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev : [...prev, item],
    );
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function clear() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}
