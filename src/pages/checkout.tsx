import React, { useState, useEffect } from "react";
import { CreditCard, ShoppingBag, Truck, MapPin, Building, ArrowRight, ShieldCheck, Mail, Phone, User, Disc } from "lucide-react";
import { useCart } from "../components/cart/cart-provider.js";
import { useNavigate } from "../components/router.js";

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { navigate } = useNavigate();

  // Personal details state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Delivery / Payment details state
  const [deliveryMethod, setDeliveryMethod] = useState<"envio" | "retiro">("envio");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "mercadopago">("efectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty on mount
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/catalogo");
    }
  }, [cart, navigate]);

  if (cart.length === 0) return null;

  // Calculate totals
  const isTransfer = paymentMethod === "transferencia";
  const isMercadoPago = paymentMethod === "mercadopago";
  const discountAmount = isTransfer ? cartTotal * 0.10 : (isMercadoPago ? cartTotal * 0.05 : 0);
  const shippingCost = deliveryMethod === "envio" ? 0 : 0; // Free express delivery
  const finalTotal = cartTotal - discountAmount + shippingCost;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert("Por favor, completá los datos personales obligatorios.");
      return;
    }

    if (deliveryMethod === "envio" && (!address.trim() || !city.trim() || !province.trim())) {
      alert("Por favor, ingresá los datos de envío a domicilio completos.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Setup payload structure matching the order requirements in server.ts
      const orderItemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      const payload = {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        shipping_address: deliveryMethod === "envio" ? address : "Retiro en Sucursal (Paraná)",
        city: deliveryMethod === "envio" ? city : "Paraná",
        state: deliveryMethod === "envio" ? province : "Entre Ríos",
        country: "Argentina",
        postal_code: "3100",
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        notes: `Método de pago: ${paymentMethod === "transferencia" ? "Transferencia Bancaria (-10%)" : paymentMethod === "mercadopago" ? "MercadoPago (-5%)" : "Efectivo contra entrega"}`,
        items: orderItemsPayload,
        subtotal: cartTotal,
        total: finalTotal
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Clear local shopping cart contents
        clearCart();

        // Redirect to MercadoPago if init_point returned
        if (data.init_point && paymentMethod === "mercadopago") {
          window.location.href = data.init_point;
          return;
        }

        const orderNum = data.order_number || (data.order && data.order.order_number) || (data.id || data.order?.id);
        const lookupToken = data.lookup_token || data.order?.lookup_token;
        // Redirect to order confirmation path with secure lookup token
        if (orderNum) {
          const query = lookupToken ? `?token=${encodeURIComponent(lookupToken)}` : "";
          navigate(`/pedido/${orderNum}${query}`);
        } else {
          navigate("/catalogo");
        }
      } else {
        const errData = await response.json().catch(() => ({ error: "Error al procesar el pedido" }));
        alert(`Fallo en compra: ${errData.error || errData.message || "Por favor revisá los datos del pedido."}`);
      }
    } catch (err) {
      console.error("Error submitting purchase checkout:", err);
      alert("Error de red al procesar el pedido. Comprobá tu conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 font-sans tech-bg">
      
      {/* Title */}
      <div className="border-b border-border/40 pb-4">
        <span className="text-[10px] font-serif uppercase tracking-widest text-accent font-bold">Compra Segura</span>
        <h1 className="font-serif text-3xl font-bold text-foreground">Finalizar Compra</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: DETAILS & OPTIONS FORM ================= */}
        <form onSubmit={handleSubmitOrder} className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Step 1: Personal Details */}
          <section className="bg-card border border-border/50 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/35 pb-2">
              <User className="w-4 h-4 text-accent" />
              <span>1. Información de Contacto</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofia Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-muted-foreground font-semibold">Teléfono móvil *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +54 11 5555-8326"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-muted-foreground font-semibold">Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="Ej: sofia@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent"
              />
            </div>
          </section>

          {/* Step 2: Delivery Method Selection */}
          <section className="bg-card border border-border/50 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/35 pb-2">
              <Truck className="w-4 h-4 text-accent" />
              <span>2. Métodos de Entrega</span>
            </h3>

            {/* Toggle options buttons */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDeliveryMethod("envio")}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  deliveryMethod === "envio"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-border"
                }`}
              >
                <Truck className="w-5 h-5 mb-2" />
                <span className="font-bold text-foreground">Envío Express a Domicilio</span>
                <span className="text-[10px] text-accent font-serif font-bold uppercase mt-1">Gratis</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("retiro")}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  deliveryMethod === "retiro"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-border"
                }`}
              >
                <Building className="w-5 h-5 mb-2" />
                <span className="font-bold text-foreground">Retiro en Sucursal</span>
                <span className="text-[10px] text-muted-foreground font-sans mt-1">Gualeguaychú 595, Paraná</span>
              </button>
            </div>

            {/* Shipping Address Forms */}
            {deliveryMethod === "envio" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-muted-foreground">Provincia *</label>
                  <input
                    type="text"
                    required={deliveryMethod === "envio"}
                    placeholder="Ej: Buenos Aires"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                  />
                </div>
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-muted-foreground">Ciudad / Localidad *</label>
                  <input
                    type="text"
                    required={deliveryMethod === "envio"}
                    placeholder="Ej: Vicente López"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                  />
                </div>
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-muted-foreground">Dirección y Altura *</label>
                  <input
                    type="text"
                    required={deliveryMethod === "envio"}
                    placeholder="Ej: San Martín 450, Piso 3B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-foreground"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-muted/60 border border-border/40 rounded-lg text-xs text-muted-foreground flex gap-2 items-start leading-normal">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Sucursal DR.TECNO Central</p>
                  <p className="mt-0.5">Gualeguaychú 595, Paraná, Entre Ríos.</p>
                  <p className="text-[10px] text-accent mt-0.5 font-serif font-bold">Lun-Vie: 09:00 a 20:00 hs | Sáb: 09:00 a 13:00 hs.</p>
                </div>
              </div>
            )}
          </section>

          {/* Step 3: Payment Method Selection */}
          <section className="bg-card border border-border/50 rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/35 pb-2">
              <CreditCard className="w-4 h-4 text-accent" />
              <span>3. Método de Pago</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod("efectivo")}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                  paymentMethod === "efectivo"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-border"
                }`}
              >
                <Disc className="w-5 h-5 mb-2" />
                <span className="font-bold text-foreground">Efectivo contra entrega</span>
                <span className="text-[10px] text-muted-foreground mt-1">Abonás al recibir el producto.</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("transferencia")}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                  paymentMethod === "transferencia"
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-border"
                }`}
              >
                {/* 10% Off Badge */}
                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-serif font-bold px-1.5 py-0.5 rounded-full animate-pulse-subtle">
                  -10% OFF
                </span>
                
                <CreditCard className="w-5 h-5 mb-2" />
                <span className="font-bold text-foreground">Transferencia Directa</span>
                <span className="text-[10px] text-accent font-serif font-bold mt-1">Obtenés 10% de descuento.</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("mercadopago")}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                  paymentMethod === "mercadopago"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-border"
                }`}
              >
                {/* 5% Off Badge */}
                <span className="absolute top-2 right-2 bg-sky-500 text-white text-[9px] font-serif font-bold px-1.5 py-0.5 rounded-full">
                  -5% OFF
                </span>

                <CreditCard className="w-5 h-5 mb-2 text-sky-400" />
                <span className="font-bold text-foreground">Mercado Pago / Tarjetas</span>
                <span className="text-[10px] text-sky-400 font-serif font-bold mt-1">QR, Dinero en cuenta o Cuotas.</span>
              </button>
            </div>

            {paymentMethod === "mercadopago" && (
              <div className="p-4 bg-sky-950/20 border border-sky-500/20 rounded-xl space-y-1.5 text-xs text-sky-200">
                <span className="font-semibold font-serif uppercase text-[9px] tracking-widest text-sky-400 block">✨ PAGO SEGURO CON MERCADO PAGO</span>
                <p className="text-muted-foreground">Al confirmar tu pedido serás redirigido automáticamente al checkout oficial de Mercado Pago para abonar con tarjeta, saldo o QR.</p>
              </div>
            )}

            {paymentMethod === "transferencia" && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground font-serif uppercase text-[9px] tracking-widest text-accent block">DATOS DE TRANSFERENCIA BANCARIA</span>
                <p>Realizá la transferencia al siguiente CBU y enviá el comprobante:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-background p-2.5 rounded border border-border/40 text-foreground select-all">
                  <div><span>Banco:</span> <span className="text-accent font-sans font-bold">Galicia</span></div>
                  <div><span>Titular:</span> <span className="text-accent font-sans font-bold">DR TECNO SRL</span></div>
                  <div className="col-span-2"><span>CBU:</span> <span className="text-accent font-serif font-bold tracking-wider">0070123420000005432101</span></div>
                  <div className="col-span-2"><span>Alias:</span> <span className="text-accent font-serif font-bold">DR.TECNO.OFICIAL</span></div>
                </div>
              </div>
            )}
          </section>

          {/* Action Confirm Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-accent hover:bg-accent/90 disabled:bg-muted-foreground text-accent-foreground rounded-lg font-serif font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg text-sm pt-0.5"
          >
            <span>{isSubmitting ? "Procesando Pedido..." : "Confirmar y Registrar Pedido"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* ================= RIGHT COLUMN: ORDER SUMMARY ================= */}
        <aside className="bg-card border border-border/60 rounded-xl p-5 sm:p-6 space-y-5 h-fit shrink-0">
          <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/35 pb-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <span>Resumen del Pedido</span>
          </h3>

          {/* Items listing */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-2.5 text-xs">
                <img
                  src={item.product.image_url || undefined}
                  alt={item.product.name}
                  className="w-10 h-10 object-cover rounded bg-muted/15 border border-border/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="font-sans font-medium text-foreground truncate">{item.product.name}</h4>
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span>Cant: {item.quantity}</span>
                    <span className="font-serif font-bold text-foreground">
                      $ {(item.product.price * item.quantity).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calculations Summary */}
          <div className="border-t border-border/30 pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal artículos</span>
              <span>$ {cartTotal.toLocaleString("es-AR")}</span>
            </div>
            
            {isTransfer && (
              <div className="flex items-center justify-between text-emerald-400 font-medium">
                <span>Descuento Transferencia (-10%)</span>
                <span>− $ {discountAmount.toLocaleString("es-AR")}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Costo de envío</span>
              <span className="text-accent uppercase font-serif tracking-widest text-[9px] font-bold">Sin Costo</span>
            </div>

            <div className="flex items-center justify-between font-serif font-bold text-sm text-foreground pt-3 border-t border-border/40">
              <span>TOTAL GENERAL</span>
              <span className="text-accent text-base">
                $ {finalTotal.toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          <div className="p-3 bg-muted/40 border border-border/30 rounded-lg text-[10px] text-muted-foreground flex gap-1.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p>Tus compras están totalmente protegidas por nuestra política de garantía escrita de 30 días.</p>
          </div>
        </aside>

      </div>

    </div>
  );
};
