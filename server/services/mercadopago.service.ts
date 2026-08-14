import crypto from "crypto";
import { db } from "../db.js";
import { env } from "../config/env.js";
import { Order } from "../../src/types.js";

export interface CreatePreferenceOptions {
  order: Order;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export async function createMercadoPagoPreference(options: {
  order: Order;
  items: {
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}): Promise<{ preferenceId: string; initPoint: string; sandboxInitPoint: string }> {
  // Access token is loaded EXCLUSIVELY from server environment secrets
  const accessToken = env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Mercado Pago no está configurado en las variables de entorno del servidor (MERCADOPAGO_ACCESS_TOKEN).");
  }

  const { order, items } = options;
  const appUrl = env.APP_URL;

  // Build line items for MP Preference
  const mpItems = items.map((item) => ({
    id: item.product_id || `item-${Math.random().toString(36).substring(2, 7)}`,
    title: item.product_name,
    quantity: item.quantity,
    currency_id: "ARS",
    unit_price: Number(item.unit_price)
  }));

  const lookupParam = order.lookup_token ? `&token=${encodeURIComponent(order.lookup_token)}` : "";

  const preferencePayload = {
    items: mpItems,
    payer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone ? { number: order.customer_phone } : undefined,
      address: order.shipping_address ? { street_name: order.shipping_address } : undefined
    },
    back_urls: {
      success: `${appUrl}/pedido/${encodeURIComponent(order.order_number)}?status=success${lookupParam}`,
      pending: `${appUrl}/pedido/${encodeURIComponent(order.order_number)}?status=pending${lookupParam}`,
      failure: `${appUrl}/pedido/${encodeURIComponent(order.order_number)}?status=failure${lookupParam}`
    },
    auto_return: "approved",
    external_reference: order.order_number,
    statement_descriptor: "DR TECNO STORE",
    notification_url: `${appUrl}/api/mercadopago/webhook`,
    metadata: {
      order_id: order.id,
      order_number: order.order_number
    }
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(preferencePayload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Mercado Pago preference API error:", errorBody);
    throw new Error(`Error comunicando con Mercado Pago: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point || data.init_point
  };
}

/**
 * Validates Mercado Pago official Webhook HMAC signature according to official specification:
 * Header x-signature: ts=...,v1=...
 * Header x-request-id: <uuid>
 * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export function verifyMercadoPagoWebhookSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string | undefined
): { valid: boolean; reason?: string } {
  const secret = env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // If webhook secret is not set, log warning and allow fallback to direct API verification
    return { valid: true };
  }

  if (!xSignature || !xRequestId || !dataId) {
    return {
      valid: false,
      reason: "Headers de firma incompletos (x-signature, x-request-id o data.id ausentes)"
    };
  }

  try {
    const parts = xSignature.split(",");
    let ts = "";
    let v1Hash = "";

    for (const part of parts) {
      const [key, val] = part.trim().split("=");
      if (key === "ts") ts = val;
      if (key === "v1") v1Hash = val;
    }

    if (!ts || !v1Hash) {
      return { valid: false, reason: "Formato de x-signature inválido" };
    }

    // Build standard manifest template
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    const match = crypto.timingSafeEqual(
      Buffer.from(computed, "utf-8"),
      Buffer.from(v1Hash, "utf-8")
    );

    return {
      valid: match,
      reason: match ? undefined : "La firma criptográfica HMAC-SHA256 no coincide con el secreto configurado"
    };
  } catch (err: any) {
    return { valid: false, reason: `Error al verificar firma: ${err.message}` };
  }
}

// Process Webhook Notification idempotently and securely
export async function processMercadoPagoWebhook(
  payload: any,
  query: any,
  headers: Record<string, string | string[] | undefined>
): Promise<{ handled: boolean; message: string; statusCode?: number }> {
  // Access token strictly from server environment secrets
  const accessToken = env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return { handled: false, message: "MERCADOPAGO_ACCESS_TOKEN no está configurado en el servidor", statusCode: 500 };
  }

  const type = payload?.type || query?.type || payload?.topic || query?.topic;
  const paymentId = payload?.data?.id || query?.["data.id"] || query?.id || payload?.id;

  // 1. Webhook Signature / Authenticity Verification
  const xSignature = (headers["x-signature"] || headers["X-Signature"]) as string | undefined;
  const xRequestId = (headers["x-request-id"] || headers["X-Request-Id"]) as string | undefined;

  if (paymentId && env.MERCADOPAGO_WEBHOOK_SECRET) {
    const sigCheck = verifyMercadoPagoWebhookSignature(xSignature, xRequestId, String(paymentId));
    if (!sigCheck.valid) {
      console.warn("⚠️ Rechazado webhook de Mercado Pago por firma inválida:", sigCheck.reason);
      return { handled: false, message: `Firma inválida: ${sigCheck.reason}`, statusCode: 401 };
    }
  }

  if ((type === "payment" || query?.topic === "payment") && paymentId) {
    try {
      // 2. Query official Mercado Pago API directly to prevent spoofing
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!paymentRes.ok) {
        console.warn(`Could not verify payment ${paymentId} with Mercado Pago API (Status: ${paymentRes.status})`);
        return { handled: false, message: "No se pudo verificar el pago con Mercado Pago API", statusCode: 400 };
      }

      const paymentData = await paymentRes.json();
      const externalReference = paymentData.external_reference;
      const mpStatus = paymentData.status; // 'approved', 'pending', 'in_process', 'rejected', 'refunded', 'cancelled'

      // 3. Validate external_reference against local orders
      if (!externalReference) {
        return { handled: false, message: "El pago no contiene external_reference", statusCode: 400 };
      }

      const order = await db.getOrderByNumber(externalReference);
      if (!order) {
        return { handled: false, message: `No se encontró la orden con número ${externalReference}`, statusCode: 404 };
      }

      let commercialStatus = order.status;
      let paymentStatus: any = "pending";

      if (mpStatus === "approved") {
        paymentStatus = "approved";
        commercialStatus = "En preparación";
      } else if (mpStatus === "rejected") {
        paymentStatus = "rejected";
      } else if (mpStatus === "cancelled") {
        paymentStatus = "cancelled";
        commercialStatus = "Cancelado";
      } else if (mpStatus === "refunded") {
        paymentStatus = "refunded";
        commercialStatus = "Cancelado";
      } else {
        paymentStatus = "pending";
      }

      // 4. Strong Idempotency: skip update if payment status and payment_id are already recorded
      if (order.payment_status === paymentStatus && order.payment_id === String(paymentId)) {
        return {
          handled: true,
          message: `Orden ${order.order_number} ya se encontraba procesada con estado ${paymentStatus} (idempotente)`
        };
      }

      // 5. Stock release on cancellation/refund
      if ((paymentStatus === "cancelled" || paymentStatus === "refunded" || paymentStatus === "rejected") && order.payment_status !== "cancelled" && order.payment_status !== "refunded") {
        try {
          await db.replenishOrderStock(order.id);
          console.log(`📦 Stock reingresado al inventario para la orden cancelada/rechazada ${order.order_number}`);
        } catch (stockErr) {
          console.error("Error al reingresar stock de orden cancelada:", stockErr);
        }
      }

      // 6. Update order status atomically
      await db.updateOrderStatus(order.id, commercialStatus, paymentStatus, String(paymentId));
      console.log(`✅ Orden ${order.order_number} actualizada via MP webhook. Estado de pago: ${paymentStatus}`);
      return { handled: true, message: `Orden ${order.order_number} actualizada a ${paymentStatus}` };
    } catch (err: any) {
      console.error("Error processing MP payment verification:", err);
      return { handled: false, message: `Error procesando pago: ${err.message}`, statusCode: 500 };
    }
  }

  return { handled: true, message: "Notificación de tipo no transaccional recibida" };
}
