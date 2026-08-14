import React, { useState, useEffect } from "react";
import { CheckCircle, ShieldCheck, Mail, Printer, ExternalLink, Cpu, CreditCard, Landmark } from "lucide-react";
import { useNavigate } from "../components/router.js";

interface OrderConfirmationProps {
  orderNumber: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_province: string;
  delivery_method: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_name: string;
    brand: string;
    quantity: number;
    price_unit: number;
  }>;
}

export const OrderConfirmacionPage: React.FC<OrderConfirmationProps> = ({ orderNumber }) => {
  const { navigate } = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(false);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token") || "";
        const query = token ? `?token=${encodeURIComponent(token)}` : "";
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}${query}`);
        if (response.ok) {
          const data = await response.json();
          // Normalize backend Order format to frontend OrderDetails format
          const normalized: OrderDetails = {
            id: data.id,
            order_number: data.order_number,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone || "",
            customer_address: data.shipping_address || "Retiro en Sucursal",
            customer_city: data.city || "",
            customer_province: data.state || "",
            delivery_method: data.delivery_method || "",
            payment_method: (data.notes || "").toLowerCase().includes("transferencia") ? "transferencia" : "efectivo",
            total_amount: data.total || 0,
            status: data.status || "",
            created_at: data.created_at || "",
            items: (data.items || []).map((item: any) => ({
              id: item.id || `item-${Math.random()}`,
              product_name: item.product_name || "",
              brand: item.brand || "",
              quantity: item.quantity || 1,
              price_unit: item.unit_price || 0
            }))
          };
          setOrder(normalized);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading order confirmation:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 animate-pulse font-sans tech-bg">
        <div className="h-10 w-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Procesando factura de compra en Dr Tecno...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4 font-sans tech-bg">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-serif font-bold">
          !
        </div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Pedido no encontrado</h1>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          El número de orden "{orderNumber}" es incorrecto o todavía no se registró en nuestro almacén seguro de Supabase.
        </p>
        <button
          onClick={() => navigate("/catalogo")}
          className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-xs font-serif font-bold uppercase hover:bg-accent/90 transition-all cursor-pointer"
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8 font-sans tech-bg">
      
      {/* 1. Header Success block */}
      <div className="text-center space-y-3 p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl animate-scale-up">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">¡Gracias por tu compra!</h1>
          <p className="text-xs text-emerald-300">Tu pedido ha sido registrado con éxito en nuestro sistema.</p>
        </div>
        
        {/* Order tracking number details */}
        <div className="pt-2">
          <span className="text-[10px] text-muted-foreground uppercase font-serif tracking-widest block">NÚMERO DE COMPRA</span>
          <span className="font-serif font-bold text-xl text-foreground select-all tracking-wider">
            {order.order_number}
          </span>
        </div>
      </div>

      {/* 2. Payment Instructions if Bank Transfer */}
      {order.payment_method === "transferencia" && (
        <section className="bg-card border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg animate-slide-up">
          <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-2">
            <Landmark className="w-4 h-4 text-accent" />
            <span>Instrucciones de Pago Pendiente</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para finalizar el despacho de tus artículos, por favor realizá la transferencia del importe exacto por el home banking de tu preferencia y envianos el comprobante por WhatsApp o correo electrónico.
          </p>

          <div className="p-4 bg-background border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-foreground select-all">
              <div><span>Banco:</span> <span className="text-accent font-sans font-bold">Galicia</span></div>
              <div><span>Titular:</span> <span className="text-accent font-sans font-bold">DR TECNO SRL</span></div>
              <div className="col-span-2"><span>CBU:</span> <span className="text-accent font-serif font-bold tracking-wider">0070123420000005432101</span></div>
              <div className="col-span-2"><span>Alias:</span> <span className="text-accent font-serif font-bold">DR.TECNO.OFICIAL</span></div>
              <div className="col-span-2 border-t border-border/35 pt-1.5 mt-1 text-xs font-sans text-muted-foreground flex justify-between">
                <span>IMPORTE TOTAL A TRANSFERIR:</span>
                <span className="text-accent font-serif font-bold text-sm">
                  $ {order.total_amount.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            💡 Recordá detallar tu número de compra <strong>{order.order_number}</strong> en la referencia de la transferencia. Una vez verificado el saldo, se despacha el producto de inmediato.
          </div>
        </section>
      )}

      {/* 3. Invoice Summary Details Receipt */}
      <section className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6 space-y-5 shadow">
        <h3 className="font-serif text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-2">
          <Printer className="w-4 h-4 text-accent" />
          <span>Resumen de tu Factura</span>
        </h3>

        {/* Customer Details info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-border/30 pb-4">
          <div className="space-y-1">
            <span className="text-muted-foreground font-semibold">Cliente</span>
            <p className="text-foreground font-medium">{order.customer_name}</p>
            <p className="text-[11px] text-muted-foreground">{order.customer_email}</p>
            <p className="text-[11px] text-muted-foreground">{order.customer_phone}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground font-semibold">Entrega</span>
            <p className="text-foreground font-medium uppercase text-[10px] tracking-wider font-serif">
              {order.delivery_method === "envio" ? "Envío a Domicilio" : "Retiro en Sucursal"}
            </p>
            <p className="text-[11px] text-muted-foreground">{order.customer_address}</p>
            <p className="text-[11px] text-muted-foreground">{order.customer_city}, {order.customer_province}</p>
          </div>
        </div>

        {/* Items bought listing */}
        <div className="space-y-3">
          <span className="text-muted-foreground font-semibold text-xs block">Artículos Facturados</span>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs border-b border-border/10 pb-2 last:border-b-0">
              <div className="min-w-0 pr-4">
                <span className="text-[9px] text-accent uppercase font-serif tracking-widest">{item.brand}</span>
                <p className="text-foreground font-medium truncate">{item.product_name}</p>
                <span className="text-[10px] text-muted-foreground">Cantidad: {item.quantity}</span>
              </div>
              <span className="font-serif font-bold text-foreground shrink-0 text-right">
                $ {(item.price_unit * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
        </div>

        {/* Financial calculations */}
        <div className="border-t border-border/30 pt-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Método de Pago</span>
            <span className="text-foreground uppercase text-[10px] font-semibold tracking-wider font-serif">
              {order.payment_method === "transferencia" ? "Transferencia Bancaria (-10% off)" : "Efectivo contra entrega"}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Costo de Despacho</span>
            <span className="text-emerald-400 uppercase text-[9px] font-bold">Sin Costo</span>
          </div>
          <div className="flex items-center justify-between font-serif font-bold text-sm text-foreground pt-3 border-t border-border/40">
            <span>IMPORTE TOTAL FACTURADO</span>
            <span className="text-accent text-base">
              $ {order.total_amount.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Footer links actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          onClick={() => navigate("/")}
          className="w-full h-11 border border-border hover:bg-muted text-foreground rounded-lg font-serif font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          Volver al Inicio
        </button>

        <button
          onClick={() => navigate("/catalogo")}
          className="w-full h-11 bg-accent text-accent-foreground rounded-lg font-serif font-bold text-xs uppercase tracking-widest hover:bg-accent/90 transition-all cursor-pointer"
        >
          Continuar Comprando
        </button>
      </div>

    </div>
  );
};
