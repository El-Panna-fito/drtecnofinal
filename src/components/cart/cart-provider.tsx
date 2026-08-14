import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, Product } from "../../types.js";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  triggerToast: (msg: string, type?: "success" | "info" | "error") => void;
  toastMessage: { text: string; type: "success" | "info" | "error"; id: number } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error"; id: number } | null>(null);

  // Load cart from localStorage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dr_tecno_cart");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("dr_tecno_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const triggerToast = (text: string, type: "success" | "info" | "error" = "success") => {
    const id = Date.now();
    setToastMessage({ text, type, id });
    setTimeout(() => {
      setToastMessage(curr => curr?.id === id ? null : curr);
    }, 4000);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0 || !product.active) {
      triggerToast("Este producto no se encuentra disponible actualmente.", "error");
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);

      if (existingIdx !== -1) {
        const existingItem = prev[existingIdx];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          triggerToast(`Stock insuficiente. Solo quedan ${product.stock} unidades en almacén.`, "info");
          const updated = [...prev];
          updated[existingIdx] = {
            ...existingItem,
            quantity: product.stock,
          };
          return updated;
        }

        const updated = [...prev];
        updated[existingIdx] = {
          ...existingItem,
          quantity: newQuantity,
        };
        triggerToast(`Se actualizó la cantidad de ${product.name} en el carrito.`);
        return updated;
      } else {
        if (quantity > product.stock) {
          triggerToast(`Stock insuficiente. Solo se añadieron ${product.stock} unidades.`, "info");
          return [...prev, { product, quantity: product.stock }];
        }
        triggerToast(`${product.name} añadido al carrito con éxito.`);
        return [...prev, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find(i => i.product.id === productId);
      if (item) {
        triggerToast(`${item.product.name} fue eliminado del carrito.`, "info");
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;

      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }

      if (quantity > existing.product.stock) {
        triggerToast(`Límite alcanzado: solo hay ${existing.product.stock} unidades en stock.`, "info");
        return prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: item.product.stock } : item
        );
      }

      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    triggerToast("Se vació el carrito correctamente.", "info");
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setCartOpen,
        triggerToast,
        toastMessage,
      }}
    >
      {children}
      {/* Visual notification toaster overlay */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl border border-border/40 backdrop-blur-md transition-all duration-300 animate-slide-up font-sans text-sm ${
            toastMessage.type === "success" 
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30" 
              : toastMessage.type === "error"
              ? "bg-rose-950/90 text-rose-300 border-rose-500/30"
              : "bg-sky-950/90 text-sky-300 border-sky-500/30"
          }`}
        >
          <div className="h-2 w-2 rounded-full animate-ping bg-current" />
          <span>{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-3 hover:opacity-100 opacity-60 text-current font-bold"
          >
            ×
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
