import React, { useEffect } from "react";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "./cart-provider.js";
import { useNavigate } from "../router.js";

export const CartSheet: React.FC = () => {
  const { cart, isCartOpen, setCartOpen, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { navigate } = useNavigate();

  // Close sheet on ESC press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setCartOpen]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div id="cart-sheet-overlay" className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Sheet Content Panel */}
      <div 
        id="cart-sheet-panel"
        className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col z-10 animate-slide-left"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent animate-pulse-subtle" />
            <h3 className="font-serif font-bold text-foreground">Tu Carrito</h3>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-serif font-bold">
              {cart.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={() => setCartOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-3 text-border opacity-65" />
              <p className="font-sans font-medium text-sm">Tu carrito está vacío</p>
              <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                ¡Añadí los mejores artículos tecnológicos en nuestra pestaña de Catálogo!
              </p>
              <button
                onClick={() => {
                  setCartOpen(false);
                  navigate("/catalogo");
                }}
                className="mt-4 px-4 py-2 bg-accent text-accent-foreground text-xs font-serif font-bold rounded-lg hover:bg-accent/90 transition-all cursor-pointer"
              >
                Ir al Catálogo
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id}
                className="flex gap-3 p-3 bg-muted/40 border border-border/50 rounded-xl relative group transition-colors hover:border-border"
              >
                {/* Product image */}
                <img
                  src={item.product.image_url || undefined}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg bg-card border border-border/40 shrink-0"
                  referrerPolicy="no-referrer"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-sans font-medium text-xs text-foreground truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-serif mt-0.5">
                      {item.product.brand}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controllers */}
                    <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden h-7">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-serif font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price total for item */}
                    <div className="text-right">
                      <p className="text-xs font-serif font-bold text-foreground">
                        $ {(item.product.price * item.quantity).toLocaleString("es-AR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        u.p: $ {item.product.price.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove single item button */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Eliminar del carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions and summaries */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/20 space-y-4 shrink-0">
            {/* Calculation summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
                <span>Subtotal del carrito</span>
                <span>$ {cartTotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
                <span>Envío express</span>
                <span className="text-accent uppercase font-serif tracking-wider font-semibold text-[10px]">Sin Costo</span>
              </div>
              <div className="flex items-center justify-between text-sm font-serif font-bold text-foreground pt-1.5 border-t border-border/40">
                <span>Total de tu pedido</span>
                <span className="text-accent text-base">
                  $ {cartTotal.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Actions buttons */}
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={handleCheckoutClick}
                className="w-full h-11 bg-accent text-accent-foreground rounded-lg font-serif font-bold text-sm tracking-wide hover:bg-accent/90 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={clearCart}
                className="w-full h-9 bg-transparent hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded-lg text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Carrito</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
