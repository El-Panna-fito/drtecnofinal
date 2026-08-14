import { db } from "../db.js";
import { createMercadoPagoPreference } from "./mercadopago.service.js";
import { Order } from "../../src/types.js";

export interface CreateOrderInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_dni?: string | null;
  shipping_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  delivery_method?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export async function processAndCreateOrder(input: CreateOrderInput): Promise<{
  order: Order;
  initPoint?: string;
  sandboxInitPoint?: string;
}> {
  if (!input.items || input.items.length === 0) {
    throw new Error("El pedido debe contener al menos un producto.");
  }

  // 1. Fetch Authoritative Products from DB and calculate totals
  let calculatedSubtotal = 0;
  const verifiedOrderItems: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[] = [];

  for (const item of input.items) {
    const product = await db.getProductById(item.product_id);
    if (!product) {
      throw new Error(`El producto con ID ${item.product_id} no existe o no está disponible.`);
    }

    if (!product.active) {
      throw new Error(`El producto "${product.name}" ya no está disponible para la venta.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para "${product.name}". Disponibles: ${product.stock}, solicitados: ${item.quantity}.`);
    }

    const unitPrice = Number(product.price);
    const itemSubtotal = unitPrice * item.quantity;
    calculatedSubtotal += itemSubtotal;

    verifiedOrderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice
    });
  }

  const discounts = 0;
  const shippingCost = 0;
  const calculatedTotal = calculatedSubtotal - discounts + shippingCost;

  // 2. Persist Order in DB
  const paymentMethod = input.payment_method || "efectivo";
  const newOrder = await db.createOrder(
    {
      customer_id: null,
      customer_name: input.customer_name.trim(),
      customer_email: input.customer_email.trim().toLowerCase(),
      customer_phone: input.customer_phone?.trim() || null,
      customer_dni: input.customer_dni?.trim() || null,
      shipping_address: input.shipping_address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      country: input.country?.trim() || "Argentina",
      postal_code: input.postal_code?.trim() || null,
      delivery_method: input.delivery_method || "envio",
      payment_method: paymentMethod,
      payment_status: "pending",
      payment_id: null,
      external_reference: null,
      notes: input.notes?.trim() || null,
      subtotal: calculatedSubtotal,
      discounts,
      shipping_cost: shippingCost,
      total: calculatedTotal,
      status: "En preparación",
      items_count: verifiedOrderItems.reduce((acc, i) => acc + i.quantity, 0)
    },
    verifiedOrderItems
  );

  // 3. If Mercado Pago, generate Preference
  let initPoint: string | undefined;
  let sandboxInitPoint: string | undefined;

  if (paymentMethod === "mercadopago") {
    try {
      const pref = await createMercadoPagoPreference({
        order: newOrder,
        items: verifiedOrderItems
      });
      initPoint = pref.initPoint;
      sandboxInitPoint = pref.sandboxInitPoint;
    } catch (mpErr: any) {
      console.warn("Mercado Pago preference creation notice:", mpErr.message);
      // Order is created, payment link can be regenerated or paid manually
    }
  }

  return {
    order: newOrder,
    initPoint,
    sandboxInitPoint
  };
}
