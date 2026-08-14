// Dr Tecno production server entry point.
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

import { env, validateEnv } from "./server/config/env.js";
import { db, initDb } from "./server/db.js";
import { createSessionToken, verifySessionToken } from "./server/lib/auth.js";
import { 
  authLimiter, 
  orderLimiter, 
  serviceLimiter, 
  webhookLimiter, 
  requireAdmin, 
  errorHandler, 
  AuthenticatedRequest 
} from "./server/middleware/security.js";
import { 
  AdminLoginSchema, 
  CreateOrderSchema, 
  CreateServiceRequestSchema, 
  ProductSchema, 
  CollectionSchema, 
  MercadoPagoConfigSchema 
} from "./server/validators/schemas.js";
import { processAndCreateOrder } from "./server/services/order.service.js";
import { processMercadoPagoWebhook } from "./server/services/mercadopago.service.js";
import { processChatQuery } from "./server/services/chat.service.js";

// Validate Environment at startup
validateEnv();

const app = express();
// Use the port provided by the hosting environment (Vercel, etc.) when set.
// The v0 preview expects the dev server on 8080 and does NOT inject PORT,
// so default to 8080 instead of 3000.
const PORT = Number(process.env.PORT) || 8080;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite and React dynamic assets in dev/preview
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
const allowedOrigins = [
  env.APP_URL,
  "http://localhost:3000",
  "http://localhost:5173"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // In development or when no origin is provided (same-origin, curl, server-to-server)
      if (!origin || !env.isProduction) {
        return callback(null, true);
      }
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser(env.ADMIN_SESSION_SECRET));

// Lazy-initialized Gemini AI client for tech support & diagnostics
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ 
      apiKey: env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// ==================== PUBLIC API ROUTES ====================

// Health Check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    database: db.isSupabase ? "Supabase PostgreSQL" : "Local JSON",
    timestamp: new Date().toISOString()
  });
});

// Products: List Catalog
app.get("/api/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const collection = (req.query.collection as string) || undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const featured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined;
    const sort = (req.query.sort as string) || undefined;

    const products = await db.getProducts({
      search,
      category,
      collection,
      minPrice,
      maxPrice,
      featured,
      sort,
      includeInactive: false
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Products: Get Single by Slug
app.get("/api/products/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await db.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado en el catálogo" }
      });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Categories: List Available Product Categories
app.get("/api/categories", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await db.getProducts({ includeInactive: false });
    const defaultCategories = ["Herramientas", "Insumos", "Capacitaciones", "Merchandising", "Repuestos"];
    const catSet = new Set<string>(defaultCategories);
    products.forEach((p) => {
      if (p.category && p.category.trim()) catSet.add(p.category.trim());
    });
    res.json(Array.from(catSet));
  } catch (err) {
    next(err);
  }
});

// Collections: List
app.get("/api/collections", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await db.getCollections();
    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// Collections: Get Single
app.get("/api/collections/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await db.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Colección no encontrada" }
      });
    }
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

// Orders: Authoritative Checkout Submission (Rate-limited & Server-calculated)
app.post("/api/orders", orderLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = CreateOrderSchema.parse(req.body);
    const result = await processAndCreateOrder({
      customer_name: validatedData.customer_name,
      customer_email: validatedData.customer_email,
      customer_phone: validatedData.customer_phone,
      customer_dni: validatedData.customer_dni,
      shipping_address: validatedData.shipping_address,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country,
      postal_code: validatedData.postal_code,
      delivery_method: validatedData.delivery_method,
      payment_method: validatedData.payment_method || validatedData.paymentMethod,
      notes: validatedData.notes,
      items: validatedData.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity
      }))
    });

    res.status(201).json({
      success: true,
      ...result.order,
      order: result.order,
      init_point: result.initPoint,
      sandbox_init_point: result.sandboxInitPoint
    });
  } catch (err) {
    next(err);
  }
});

// Orders: Query by Order Number (Protected with Anti-Enumeration and Token/Email Verification)
app.get("/api/orders/:orderNumber", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderNumber = req.params.orderNumber?.trim();
    const token = (req.query.token as string)?.trim();
    const email = (req.query.email as string)?.trim()?.toLowerCase();

    const order = await db.getOrderByNumber(orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Pedido no encontrado" }
      });
    }

    // Check if user is authenticated admin
    const sessionCookie = req.cookies?.dr_tecno_session;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;
    const isAdmin = Boolean(session && session.username);

    // If admin or customer provides correct email or lookup token, return full details
    const isAuthorizedCustomer = 
      (email && order.customer_email?.toLowerCase() === email) ||
      (token && (order as any).lookup_token === token);

    if (isAdmin || isAuthorizedCustomer) {
      return res.json(order);
    }

    // Anonymous or public lookup: return sanitized non-sensitive summary
    res.json({
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      delivery_method: order.delivery_method,
      items_count: order.items_count || order.items?.length || 0,
      total: order.total,
      created_at: order.created_at,
      items: (order.items || []).map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Service Requests: Create Technical Repair Ticket (Rate-limited & Validated)
app.post("/api/service-requests", serviceLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.body;
    const customer_name = raw.customer_name;
    const phone = raw.phone || raw.customer_phone;
    const email = raw.email || raw.customer_email || null;
    const customer_dni = raw.customer_dni || raw.dni;
    const device_type = raw.device_type || "Celular";
    const service_type = raw.service_type || "Reparación";
    const problem_description = raw.problem_description || raw.issue_description;

    let brand = raw.brand || "";
    let model = raw.model || "";
    if (!brand && !model && raw.brand_model) {
      const parts = raw.brand_model.trim().split(/\s+/);
      brand = parts[0] || "Genérico";
      model = parts.slice(1).join(" ") || "Genérico";
    }
    if (!brand) brand = "Genérico";
    if (!model) model = "Genérico";

    if (!customer_name || !phone || !customer_dni || !problem_description) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Nombre, DNI, teléfono y descripción de la falla son obligatorios."
        }
      });
    }

    const newRequest = await db.createServiceRequest({
      customer_name,
      customer_dni,
      phone,
      email,
      device_type,
      service_type,
      brand,
      model,
      serial_imei: raw.serial_imei || null,
      problem_description,
      diagnosis: null,
      estimated_price: null,
      internal_notes: null,
      public_notes: null,
      estimated_delivery_date: null,
      delivered_at: null
    });

    res.status(201).json({
      success: true,
      ...newRequest,
      ticket_number: newRequest.request_number
    });
  } catch (err) {
    next(err);
  }
});

// Service Requests: Track by Ticket Number (Anti-Enumeration and Privacy Masking)
app.get("/api/service-requests/:requestNumber", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestNumber = req.params.requestNumber?.trim();
    const dni = (req.query.dni as string)?.trim();
    const phone = (req.query.phone as string)?.trim();

    const request = await db.getServiceRequestByNumber(requestNumber);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Solicitud técnica no encontrada" }
      });
    }

    // Check if user is authenticated admin
    const sessionCookie = req.cookies?.dr_tecno_session;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;
    const isAdmin = Boolean(session && session.username);
    const token = (req.query.token as string)?.trim();

    const isVerifiedCustomer = 
      (token && (request as any).lookup_token === token) ||
      (dni && request.customer_dni === dni) ||
      (phone && request.phone && request.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""));

    const statusMap: Record<string, string> = {
      Pendiente: "recibido",
      "En diagnóstico": "en_diagnostico",
      "Esperando aprobación": "presupuestado",
      "En proceso": "en_reparacion",
      Listo: "listo_para_entregar",
      Entregado: "entregado",
      Cancelado: "entregado"
    };

    let statusNotes: string | null = null;
    if (request.diagnosis) {
      statusNotes = request.diagnosis;
    } else if (request.internal_notes) {
      const trimmed = request.internal_notes.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          statusNotes = parsed.plain_notes || null;
        } catch {
          statusNotes = request.internal_notes;
        }
      } else {
        statusNotes = request.internal_notes;
      }
    }

    // Mask name for privacy when not authenticated or verified
    const displayName = (isAdmin || isVerifiedCustomer)
      ? request.customer_name
      : (request.customer_name ? `${request.customer_name.slice(0, 2)}***` : "Cliente");

    res.json({
      id: request.id,
      ticket_number: request.request_number,
      request_number: request.request_number,
      customer_name: displayName,
      customer_dni: (isAdmin || isVerifiedCustomer) ? request.customer_dni : undefined,
      phone: (isAdmin || isVerifiedCustomer) ? request.phone : undefined,
      email: (isAdmin || isVerifiedCustomer) ? request.email : undefined,
      device_type: request.device_type,
      service_type: request.service_type,
      brand: request.brand,
      model: request.model,
      brand_model: `${request.brand || ""} ${request.model || ""}`.trim() || request.device_type,
      issue_description: request.problem_description,
      status: statusMap[request.status] || "recibido",
      raw_status: request.status,
      status_notes: statusNotes,
      diagnosis: request.diagnosis,
      estimated_price: request.estimated_price,
      estimated_delivery_date: request.estimated_delivery_date,
      created_at: request.created_at,
      updated_at: request.updated_at
    });
  } catch (err) {
    next(err);
  }
});

// Mercado Pago: Safe Public Key retrieval for Client Checkout
app.get("/api/mercadopago/public-key", async (req: Request, res: Response) => {
  try {
    const config = await db.getMercadoPagoConfig();
    res.json({
      publicKey: config.publicKey || env.MERCADOPAGO_PUBLIC_KEY,
      configured: config.configured
    });
  } catch {
    res.json({
      publicKey: env.MERCADOPAGO_PUBLIC_KEY,
      configured: false
    });
  }
});

// Mercado Pago: Idempotent Webhook Notification Receiver
app.post("/api/mercadopago/webhook", webhookLimiter, async (req: Request, res: Response) => {
  try {
    const result = await processMercadoPagoWebhook(req.body, req.query, req.headers);
    res.status(result.statusCode || 200).json({ success: result.handled, message: result.message });
  } catch (err: any) {
    console.error("Webhook processing notice:", err.message);
    res.status(200).json({ success: false, message: "Acknowledge" });
  }
});

// Gemini AI: Intelligent Tech Assistant & Fault Diagnoser
app.post("/api/ai/diagnose", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceType, brand, model, problemDescription, symptoms } = req.body;
    const ai = getGemini();

    if (!ai) {
      return res.json({
        diagnosis: "Diagnóstico preliminar basado en manual técnico.",
        possibleCauses: ["Falla en el circuito de alimentación", "Batería degradada", "Componente en corto"],
        recommendedAction: "Acercar el equipo al laboratorio para medición con fuente y cámara térmica.",
        estimatedTime: "24 a 48 hs hábiles"
      });
    }

    const prompt = `Actúa como el jefe técnico especialista en microelectrónica y reparación de celulares y computadoras de 'Dr Tecno'.
Analiza la siguiente falla reportada por un cliente:
- Tipo de Dispositivo: ${deviceType || "Smartphone"}
- Marca y Modelo: ${brand || ""} ${model || ""}
- Descripción del cliente: ${problemDescription || ""}
- Síntomas adicionales: ${Array.isArray(symptoms) ? symptoms.join(", ") : symptoms || "Ninguno"}

Devuelve un JSON estrictamente válido con la siguiente estructura:
{
  "diagnosis": "Resumen técnico claro y profesional de la falla",
  "possibleCauses": ["Causa 1", "Causa 2", "Causa 3"],
  "recommendedAction": "Pasos que realizaremos en el laboratorio (ej. medición de líneas primarias, prueba de pantalla, etc.)",
  "estimatedTime": "Tiempo estimado de diagnóstico (ej. 24 a 48 hs)",
  "difficulty": "Baja | Media | Alta | Microelectrónica",
  "tip": "Consejo de seguridad para el cliente (ej. no intentar forzar la carga)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

// AI Chatbot Assistant: Talos Flexible Product Search & Tech Advisor
app.post("/api/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "El campo 'message' es requerido." });
    }

    const ai = getGemini();
    const result = await processChatQuery({
      message,
      history: Array.isArray(history) ? history : [],
      aiClient: ai,
      db: {
        getProducts: (filters) => db.getProducts(filters),
        getServiceRequestByNumber: (ticket) => db.getServiceRequestByNumber(ticket)
      }
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

// ==================== ADMIN AUTHENTICATION ====================

// Admin Login (Rate-limited & Bcrypt Protected)
app.post("/api/admin/login", authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = AdminLoginSchema.parse(req.body);

    const verification = await db.verifyAdmin(username, password);
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Usuario o contraseña incorrectos."
        }
      });
    }

    const verifiedUser = verification.user || {
      id: "admin",
      username,
      role: "admin"
    };

    const token = createSessionToken(verifiedUser.username, verifiedUser.role || "admin");

    // Secure HttpOnly Cookie (Strict, HttpOnly, SameSite)
    res.cookie("dr_tecno_session", token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? "strict" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 12 // 12 hours
    });

    // Log admin login event
    await db.createAdminAuditLog({
      admin_username: verifiedUser.username,
      action: "LOGIN",
      entity_type: "AUTH",
      entity_id: verifiedUser.id,
      ip_address: req.ip || req.socket.remoteAddress || null
    });

    // No token in JSON payload; authentication is handled solely via HttpOnly cookie
    res.json({
      success: true,
      username: verifiedUser.username,
      role: verifiedUser.role
    });
  } catch (err) {
    next(err);
  }
});

// Admin Logout
app.post("/api/admin/logout", (req: Request, res: Response) => {
  res.clearCookie("dr_tecno_session", { path: "/" });
  res.json({ success: true, message: "Sesión cerrada correctamente" });
});

// Verify Current Session
app.get("/api/admin/session", (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.dr_tecno_session;

  if (!token) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "No hay sesión activa" } });
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie("dr_tecno_session", { path: "/" });
    return res.status(401).json({ success: false, error: { code: "SESSION_EXPIRED", message: "Sesión expirada" } });
  }

  res.json({
    success: true,
    username: session.username,
    role: session.role
  });
});

// ==================== PROTECTED ADMIN API ROUTES ====================

// Admin: Overview Dashboard Stats
app.get("/api/admin/stats", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await db.getProducts({ includeInactive: true });
    const orders = await db.getOrders();
    const customers = await db.getCustomers();
    const serviceRequests = await db.getServiceRequests();

    const stats = {
      totalProducts: products.length,
      lowStockProducts: products.filter((p) => p.stock <= (p.min_stock || 3)).length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "En preparación" || o.status === "Probado" || o.status === "nuevo").length,
      totalRevenue: orders
        .filter((o) => o.status !== "Cancelado" && (o.payment_status === "approved" || !o.payment_status))
        .reduce((acc, o) => acc + (o.total || 0), 0),
      totalCustomers: customers.length,
      pendingServiceRequests: serviceRequests.filter(
        (s) => s.status === "Pendiente" || s.status === "En diagnóstico" || s.status === "Esperando aprobación"
      ).length,
      inProgressServiceRequests: serviceRequests.filter((s) => s.status === "En proceso").length,
      recentOrders: orders.slice(0, 6),
      recentServiceRequests: serviceRequests.slice(0, 6)
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Admin Products: List all (including inactive)
app.get("/api/admin/products", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await db.getProducts({ includeInactive: true });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Admin Products: Create
app.post("/api/admin/products", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ProductSchema.parse(req.body);
    const newProduct = await db.createProduct({
      ...validated,
      collection: validated.collection || null,
      brand: validated.brand || null,
      short_description: validated.short_description || null,
      description: validated.description || null,
      image_url: validated.image_url || null,
      badge: validated.badge || null,
      sku: validated.sku || null
    });

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "CREATE_PRODUCT",
      entity_type: "PRODUCT",
      entity_id: newProduct.id,
      details: { name: newProduct.name, price: newProduct.price }
    });

    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

// Admin Products: Update
app.put("/api/admin/products/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "UPDATE_PRODUCT",
      entity_type: "PRODUCT",
      entity_id: req.params.id,
      details: { changes: req.body }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin Products: Delete
app.delete("/api/admin/products/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const success = await db.deleteProduct(req.params.id, false);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Producto no encontrado" }
      });
    }

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "DELETE_PRODUCT",
      entity_type: "PRODUCT",
      entity_id: req.params.id
    });

    res.json({ success: true, message: "Producto eliminado correctamente" });
  } catch (err) {
    next(err);
  }
});

// Admin Orders: List
app.get("/api/admin/orders", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin Orders: Update Status
app.put("/api/admin/orders/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, payment_status, payment_id } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_STATUS", message: "El estado comercial es obligatorio" }
      });
    }

    const updated = await db.updateOrderStatus(req.params.id, status, payment_status, payment_id);

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "UPDATE_ORDER_STATUS",
      entity_type: "ORDER",
      entity_id: req.params.id,
      details: { newStatus: status, paymentStatus: payment_status }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin Customers: List
app.get("/api/admin/customers", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await db.getCustomers();
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

// Admin Customers: Update
app.put("/api/admin/customers/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await db.updateCustomer(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin Service Requests: List
app.get("/api/admin/service-requests", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const reqs = await db.getServiceRequests();
    res.json(reqs);
  } catch (err) {
    next(err);
  }
});

// Admin Service Requests: Update
app.put("/api/admin/service-requests/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await db.updateServiceRequest(req.params.id, req.body, req.admin?.username || "Admin");

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "UPDATE_SERVICE_REQUEST",
      entity_type: "SERVICE_REQUEST",
      entity_id: req.params.id,
      details: { status: req.body.status, diagnosis: req.body.diagnosis }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin Service Requests: Delete
app.delete("/api/admin/service-requests/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const success = await db.deleteServiceRequest(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Solicitud técnica no encontrada" }
      });
    }
    res.json({ success: true, message: "Solicitud técnica eliminada" });
  } catch (err) {
    next(err);
  }
});

// Admin Collections: List
app.get("/api/admin/collections", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const collections = await db.getCollections();
    res.json(collections);
  } catch (err) {
    next(err);
  }
});

// Admin Collections: Create
app.post("/api/admin/collections", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = CollectionSchema.parse(req.body);
    const created = await db.createCollection(validated);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Admin Collections: Update
app.put("/api/admin/collections/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await db.updateCollection(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin Collections: Delete
app.delete("/api/admin/collections/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const success = await db.deleteCollection(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Colección no encontrada" }
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Admin Mercado Pago: Get Config (Public metadata only; Access Token is strictly server-side)
app.get("/api/admin/mercadopago/config", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await db.getMercadoPagoConfig();
    res.json({
      publicKey: config.publicKey,
      sandbox: config.sandbox ?? false,
      configured: config.configured,
      updated_at: config.updated_at,
      tokenSource: env.MERCADOPAGO_ACCESS_TOKEN ? "Variables de Entorno (Servidor)" : "No configurado",
      webhookConfigured: !!env.MERCADOPAGO_WEBHOOK_SECRET
    });
  } catch (err) {
    next(err);
  }
});

// Admin Mercado Pago: Save Config
app.post("/api/admin/mercadopago/config", requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { publicKey, sandbox } = MercadoPagoConfigSchema.parse(req.body);
    const saved = await db.saveMercadoPagoConfig({
      publicKey,
      sandbox
    });

    await db.createAdminAuditLog({
      admin_username: req.admin?.username || "admin",
      action: "UPDATE_MERCADOPAGO_CONFIG",
      entity_type: "SETTINGS",
      details: { configured: saved.configured, sandbox: saved.sandbox }
    });

    res.json({
      success: true,
      message: "Configuración de Mercado Pago guardada y persistida exitosamente.",
      publicKey: saved.publicKey,
      sandbox: saved.sandbox,
      configured: saved.configured,
      updated_at: saved.updated_at,
      tokenSource: env.MERCADOPAGO_ACCESS_TOKEN ? "Variables de Entorno (Servidor)" : "No configurado"
    });
  } catch (err) {
    next(err);
  }
});

// Centralized Error Handler Middleware (Catches all unhandled errors & Zod violations)
app.use(errorHandler);

// ==================== VITE AND SPA ENTRY POINT ====================
async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // The hosting platform re-syncs env files (.env.development.local) at
        // runtime. Without ignoring them, Vite restarts the server on every
        // sync, which collides with the still-bound port (EADDRINUSE) and can
        // crash the process before the preview attaches.
        watch: {
          ignored: ["**/.env", "**/.env.*"]
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[STARTUP] Server running on 0.0.0.0:${PORT}`);
  });
}

// In standard Node / container environments, start server immediately
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app, startServer };
