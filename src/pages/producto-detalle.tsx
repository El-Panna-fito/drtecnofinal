import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Sparkles, ShieldCheck, Truck, RotateCcw, Heart, Info, HelpCircle } from "lucide-react";
import { useNavigate } from "../components/router.js";
import { useCart } from "../components/cart/cart-provider.js";
import { Product } from "../types.js";
import { LocalLogoTransition } from "../components/logo-transition.js";

interface ProductDetalleProps {
  slug: string;
}

export const ProductDetallePage: React.FC<ProductDetalleProps> = ({ slug }) => {
  const { navigate } = useNavigate();
  const { addToCart, setCartOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "shipping">("specs");

  // Fetch product detail and related products on mount/slug change
  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/products/${slug}`);
        if (!response.ok) {
          setError(true);
          return;
        }
        const data: Product = await response.json();
        setProduct(data);
        setQuantity(1); // reset qty

        // Load related products in the same category (limit to 4, excluding active one)
        const relResp = await fetch(`/api/products?category=${encodeURIComponent(data.category)}`);
        if (relResp.ok) {
          const relData: Product[] = await relResp.json();
          setRelated(relData.filter(p => p.id !== data.id).slice(0, 4));
        }
      } catch (err) {
        console.error("Error loading product detail page:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 animate-pulse space-y-10 font-sans tech-bg">
        <div className="h-6 w-24 bg-muted/40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-muted/40 rounded-xl" />
          <div className="space-y-6">
            <div className="h-4 w-1/4 bg-muted/40 rounded" />
            <div className="h-10 w-3/4 bg-muted/40 rounded" />
            <div className="h-6 w-1/3 bg-muted/40 rounded" />
            <div className="h-24 bg-muted/40 rounded" />
            <div className="h-12 bg-muted/40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6 font-sans tech-bg">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-serif font-bold animate-bounce">
          !
        </div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Ficha de Producto Inexistente</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          El producto solicitado no existe, fue dado de baja de nuestro catálogo de Supabase o la URL tiene algún error de tipografía.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => navigate("/catalogo")}
            className="px-5 py-2.5 bg-accent text-accent-foreground text-xs font-serif font-bold uppercase rounded-lg hover:bg-accent/90 transition-all cursor-pointer"
          >
            Ir al Catálogo General
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 border border-border hover:bg-muted text-xs font-serif font-bold uppercase rounded-lg transition-all cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 font-sans tech-bg">
      
      {/* Back button */}
      <button
        onClick={() => navigate("/catalogo")}
        className="inline-flex items-center gap-2 text-xs font-serif font-bold text-muted-foreground hover:text-accent transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>VOLVER AL CATÁLOGO</span>
      </button>

      {/* Main product card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-card/25 border border-border/45 rounded-2xl p-6 sm:p-10 shadow-lg">
        
        {/* Gallery Image Display */}
        <div className="space-y-4">
          <div className="relative h-96 sm:h-[450px] w-full overflow-hidden bg-muted/10 border border-border/40 rounded-xl">
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-accent/20 border border-accent/40 text-accent text-xs font-serif uppercase font-bold rounded">
                {product.badge}
              </span>
            )}
            <img
              src={product.image_url || undefined}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Mock Gallery indicators */}
          <div className="flex gap-2">
            <button className="h-16 w-16 rounded-lg overflow-hidden border-2 border-accent relative bg-muted/10">
              <img src={product.image_url || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <div className="h-16 w-16 rounded-lg border border-border/40 bg-muted/15 flex items-center justify-center text-xs text-muted-foreground font-serif">
              +1
            </div>
          </div>
        </div>

        {/* Product Details info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-accent uppercase font-serif tracking-widest font-bold">
                {product.category} · {product.brand}
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight mt-1">
                {product.name}
              </h1>
            </div>

            {/* Price display */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif font-bold text-2xl sm:text-3xl text-foreground">
                $ {product.price.toLocaleString("es-AR")}
              </span>
              <span className="text-[10px] text-emerald-400 font-serif font-semibold border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/5 uppercase tracking-wider">
                Garantía oficial
              </span>
            </div>

            {/* Description */}
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
              <p className="font-medium text-foreground">{product.short_description}</p>
              <p>{product.description}</p>
            </div>
          </div>

          {/* Selector and Buy controls */}
          <div className="space-y-4 pt-6 border-t border-border/30">
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                
                {/* Quantity selector */}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-[10px] font-serif uppercase tracking-wider text-muted-foreground">Cantidad</span>
                  <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden h-10 w-32">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="flex-1 hover:bg-muted text-muted-foreground hover:text-foreground h-full font-serif font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-serif font-bold text-sm text-foreground">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="flex-1 hover:bg-muted text-muted-foreground hover:text-foreground h-full font-serif font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Stock stats */}
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Disponible en Stock
                  </span>
                  <span className="text-muted-foreground">{product.stock} unidades en almacén para envío inmediato.</span>
                </div>

              </div>
            ) : (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                ⚠️ Este artículo se encuentra temporalmente sin stock. Comunicate con soporte para reservar la próxima reposición.
              </div>
            )}

            {/* Actions buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                className="h-12 border border-accent hover:bg-accent/15 text-accent rounded-lg font-serif font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Añadir al Carrito</span>
              </button>

              <button
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="h-12 bg-accent text-accent-foreground rounded-lg font-serif font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:bg-accent/90 disabled:opacity-40 shadow-md"
              >
                <Sparkles className="w-4 h-4 fill-current animate-pulse-subtle" />
                <span>Comprar Ahora</span>
              </button>
            </div>
          </div>

          {/* Delivery & Warranties summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/30 text-xs">
            <div className="flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-foreground">12 Meses de Garantía</p>
                <p className="text-[10px] mt-0.5">Escrita oficial de Dr Tecno.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Truck className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Envío Gratis Express</p>
                <p className="text-[10px] mt-0.5">En CABA y GBA en 24 horas.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <RotateCcw className="w-5 h-5 text-accent shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Devolución Directa</p>
                <p className="text-[10px] mt-0.5">10 días para cambio de fábrica.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs specifications section */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow">
        {/* Tab Headers */}
        <div className="flex border-b border-border bg-muted/40">
          <button
            onClick={() => setActiveTab("specs")}
            className={`px-6 py-3 text-xs font-serif font-bold tracking-widest uppercase transition-colors cursor-pointer ${
              activeTab === "specs" 
                ? "bg-card border-t-2 border-t-accent text-accent" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Especificaciones Técnicas
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-6 py-3 text-xs font-serif font-bold tracking-widest uppercase transition-colors cursor-pointer ${
              activeTab === "shipping" 
                ? "bg-card border-t-2 border-t-accent text-accent" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Envíos y Garantía Completa
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 relative overflow-hidden">
          <LocalLogoTransition triggerKey={activeTab} />
          {activeTab === "specs" && (
            <div className="space-y-4">
              {Object.keys(product.specifications).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No hay especificaciones técnicas detalladas registradas para este producto.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 px-3 bg-muted/40 border border-border/30 rounded-lg text-xs">
                      <span className="font-semibold text-foreground">{key}</span>
                      <span className="text-muted-foreground mt-1 sm:mt-0 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="text-xs text-muted-foreground leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-accent" />
                  <span>Métodos de Envío y Despachos</span>
                </h4>
                <p>
                  Todas las compras son procesadas de inmediato en nuestra base de datos segura de Supabase. Si te encontrás en la Ciudad Autónoma de Buenos Aires (CABA) o Gran Buenos Aires (GBA), tu pedido se despacha mediante nuestra flota propia en menos de 24 horas hábiles.
                </p>
                <p>
                  Para envíos al interior del país, enviamos por Correo Argentino o Andreani en un plazo de 3 a 5 días hábiles. Al momento de despachar, recibirás un correo automatizado con el código de seguimiento de tu pedido.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Cobertura y Soporte Técnico</span>
                </h4>
                <p>
                  En Dr Tecno cuidamos tu inversión. Todos nuestros equipos son nuevos de origen, con embalaje original y sellados de fábrica. Contamos con laboratorio oficial propio, lo que agiliza cualquier proceso de soporte o diagnóstico técnico directo.
                </p>
                <p>
                  Para hacer valer la garantía de 12 meses, simplemente ponete en contacto a través de nuestro Chat Widget flotante, vía WhatsApp con el número de factura, o ingresando una solicitud en la pestaña de 'Servicio Técnico'.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products slider */}
      {related.length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-border/30 pb-3">
            <h3 className="font-serif text-lg font-bold text-foreground">Productos Relacionados</h3>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/producto/${prod.slug}`)}
                className="bg-card border border-border/50 hover:border-accent/30 rounded-xl p-4 flex flex-col justify-between group transition-all cursor-pointer"
              >
                <div className="h-32 w-full overflow-hidden rounded-lg bg-muted/15 mb-3">
                  <img
                    src={prod.image_url || undefined}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-accent uppercase font-serif block">{prod.brand}</span>
                  <h4 className="font-sans font-medium text-xs text-foreground group-hover:text-accent truncate transition-colors">
                    {prod.name}
                  </h4>
                  <p className="font-serif font-bold text-xs text-foreground pt-1.5">
                    $ {prod.price.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
