import { z } from "zod";

// Order item input schema (Frontend sends product_id and quantity; server computes price)
export const OrderItemSchema = z.object({
  product_id: z.string().min(1, "El ID de producto es obligatorio"),
  product_name: z.string().optional(),
  quantity: z.number().int().min(1, "La cantidad mínima es 1").max(999, "La cantidad máxima es 999"),
  unit_price: z.number().optional() // Ignored on backend, computed server-side
});

// Checkout Order creation schema
export const CreateOrderSchema = z.object({
  customer_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  customer_email: z.string().email("Formato de email inválido"),
  customer_phone: z.string().min(6, "Teléfono inválido").max(30),
  customer_dni: z.string().max(30).optional().nullable(),
  shipping_address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default("Argentina"),
  postal_code: z.string().max(20).optional().nullable(),
  delivery_method: z.enum(["envio", "retiro"]).default("envio"),
  payment_method: z.enum(["efectivo", "transferencia", "mercadopago"]).default("efectivo"),
  paymentMethod: z.string().optional(), // Frontend alias
  notes: z.string().max(500).optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "El carrito debe contener al menos un producto"),
  subtotal: z.number().optional(), // Ignored, recalculated server-side
  total: z.number().optional()     // Ignored, recalculated server-side
});

// Technical service request schema
export const CreateServiceRequestSchema = z.object({
  customer_name: z.string().min(2, "Nombre obligatorio").max(100),
  phone: z.string().min(6, "Teléfono inválido").max(30).optional(),
  customer_phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().nullable(),
  customer_email: z.string().optional(),
  customer_dni: z.string().min(4, "DNI obligatorio").max(30).optional(),
  dni: z.string().optional(),
  device_type: z.enum(["Celular", "PC de escritorio", "Notebook"]).default("Celular"),
  service_type: z.enum(["Reparación", "Mantenimiento"]).default("Reparación"),
  brand: z.string().max(50).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  brand_model: z.string().optional(),
  serial_imei: z.string().max(100).optional().nullable(),
  problem_description: z.string().min(5, "Descripción de la falla requerida").max(1000).optional(),
  issue_description: z.string().optional()
});

// Admin login schema
export const AdminLoginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio").max(100),
  password: z.string().min(1, "La contraseña es obligatoria").max(100)
});

// Product create & update schema
export const ProductSchema = z.object({
  name: z.string().min(2, "El nombre del producto es obligatorio").max(200),
  slug: z.string().min(2, "El slug es obligatorio").max(200),
  sku: z.string().max(50).optional().nullable(),
  category: z.string().min(1, "La categoría es obligatoria").max(100),
  collection: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  price: z.number().min(0, "El precio no puede ser negativo"),
  previous_price: z.number().min(0).optional().nullable(),
  wholesale_price: z.number().min(0).optional().nullable(),
  short_description: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url("URL de imagen inválida").optional().nullable().or(z.literal("")),
  images: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  min_stock: z.number().int().min(0).default(3),
  featured: z.boolean().default(false),
  badge: z.string().max(50).optional().nullable(),
  active: z.boolean().default(true)
});

// Collection schema
export const CollectionSchema = z.object({
  id: z.string().min(1, "ID de colección obligatorio").max(100).optional(),
  name: z.string().min(2, "Nombre de colección obligatorio").max(100),
  subtitle: z.string().max(100).optional().default(""),
  description: z.string().optional().default(""),
  bg_url: z.string().url().optional().or(z.literal("")).default(""),
  items_list: z.array(z.string()).default([])
});

// Mercado Pago config schema (Non-sensitive fields only; Access token is strictly env-based)
export const MercadoPagoConfigSchema = z.object({
  publicKey: z.string().max(255).optional(),
  sandbox: z.boolean().optional()
});
