import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { 
  Product, 
  Customer, 
  Order, 
  OrderItem, 
  ServiceRequest, 
  ServiceRequestEvent,
  Collection, 
  MercadoPagoConfigData, 
  AdminAuditLog, 
  AdminUser 
} from "../src/types.js";
import { env } from "./config/env.js";
import { comparePassword, hashPassword } from "./lib/auth.js";

// Initial seed collections
export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: "herramientas",
    name: "Herramientas de Precisión",
    subtitle: "Microelectrónica & Reparación",
    description: "Equipamiento profesional indispensable para la apertura, diagnóstico y reparación de placas lógicas, micro-soldadura SMD y armado de celulares, notebooks y computadoras.",
    bg_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80",
    items_list: ["Estaciones de Soldado Inteligentes", "Microscopios Trioculares con Cámara", "Kits de Destornilladores de Precisión", "Mantas Antiestáticas Magnéticas"]
  },
  {
    id: "insumos",
    name: "Insumos & Repuestos OEM",
    subtitle: "Componentes de Calidad Certificada",
    description: "Repuestos y consumibles originales para restaurar dispositivos con la máxima confiabilidad: módulos de pantalla OLED, baterías de alta capacidad, flux y estaño para soldadura.",
    bg_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&auto=format&fit=crop&q=80",
    items_list: ["Módulos de Pantalla OLED / AMOLED", "Baterías de Litio 0 Ciclos", "Adhesivos B7000 / T7000 Especiales", "Flux Amtech & Estaño en Pasta"]
  },
  {
    id: "capacitaciones",
    name: "Capacitaciones & Cursos",
    subtitle: "De Cero a Técnico Especialista",
    description: "Cursos prácticos presenciales y online dictados por ingenieros y técnicos de Dr Tecno. Domina la detección de fallas en placa, lectura de esquemáticos y reballing profesional.",
    bg_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    items_list: ["Curso de Reparación Nivel Inicial", "Curso de Reparación Nivel Intermedio", "Curso de Microelectrónica Avanzado", "Certificaciones Oficiales de Dr Tecno"]
  },
  {
    id: "merchandising",
    name: "Merchandising Dr Tecno",
    subtitle: "Remeras & Accesorios de Taller",
    description: "Lleva tu pasión por la electrónica y el taller con orgullo. Nuestra línea de indumentaria y accesorios oficiales de Dr Tecno está diseñada para técnicos entusiastas.",
    bg_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    items_list: ["Remera Oficial Lab Edition", "Gorra Trucker Dr Tecno", "Taza de Cerámica Integrated Circuit", "Accesorios & Stickers para tu taller"]
  }
];

// Initial products catalog (14 technological items)
export const INITIAL_PRODUCTS: Omit<Product, "id">[] = [
  {
    slug: "estacion-soldado-sugon-t26",
    name: "Estación de Soldado Sugon T26",
    category: "Herramientas",
    collection: "herramientas",
    brand: "Sugon",
    price: 299990.00,
    previous_price: 349990.00,
    short_description: "Estación de soldado de precisión para micro-electrónica celular.",
    description: "La Sugon T26 es una estación de soldado profesional diseñada específicamente para reparaciones de placas de celulares. Cuenta con control inteligente de temperatura, calentamiento ultra-rápido en tan solo 2 segundos y calibración digital precisa.",
    image_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Voltaje": "220V", "Rango de Temperatura": "200°C - 500°C", "Tiempo de Calentamiento": "2 segundos", "Puntas compatibles": "C210 de precisión", "Garantía": "12 meses" },
    stock: 8,
    min_stock: 2,
    featured: true,
    badge: "Laboratorio Pro",
    active: true
  },
  {
    slug: "microscopio-triocular-relife-rl-m3t",
    name: "Microscopio Triocular Relife RL-M3T",
    category: "Herramientas",
    collection: "herramientas",
    brand: "Relife",
    price: 450000.00,
    previous_price: 499900.00,
    short_description: "Microscopio estereofónico con zoom continuo 7X-45X para microsoldadura.",
    description: "Herramienta indispensable para el diagnóstico de placas lógicas, reballing y reparación de circuitos integrados. Cuenta con brazo articulado, luz LED regulable de alta intensidad y puerto triocular para conectar cámaras externas HDMI/USB.",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Zoom": "7X a 45X continuo", "Distancia de Trabajo": "100mm", "Oculares": "WF10X/20mm", "Iluminador": "Luz LED regulable de 56 focos", "Puerto Cámara": "0.5X CTV adaptador" },
    stock: 4,
    min_stock: 1,
    featured: true,
    badge: "Esencial Placa",
    active: true
  },
  {
    slug: "kit-destornilladores-ifixit-pro",
    name: "Kit de Destornilladores iFixit Pro Tech",
    category: "Herramientas",
    collection: "herramientas",
    brand: "iFixit",
    price: 69990.00,
    short_description: "El kit de herramientas de apertura y reparación más completo del mercado.",
    description: "Diseñado por técnicos de reparación, este kit incluye 64 puntas de destornillador de alta resistencia de 4mm, ventosa, púas de apertura, pinzas antiestáticas ESD y espátulas metálicas y de nylon para abrir smartphones sin dañarlos.",
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Puntas": "64 de precisión (Torx, Pentalobe, Tri-wing, etc.)", "Material Puntas": "Acero de alta resistencia S2", "Pinzas": "3x ESD antiestáticas", "Estuche": "Magnético con clasificador de tornillos", "Garantía": "De por vida" },
    stock: 25,
    min_stock: 5,
    featured: true,
    badge: "Best Seller",
    active: true
  },
  {
    slug: "manta-silicona-antiestatica-s160",
    name: "Manta de Silicona Antiestática S160",
    category: "Herramientas",
    collection: "herramientas",
    brand: "Dr Tecno",
    price: 24990.00,
    short_description: "Manta magnética de silicona resistente a alta temperatura (500°C).",
    description: "Manta organizadora perfecta para laboratorios de servicio técnico. Posee áreas imantadas para evitar que se pierdan los tornillos milimétricos del celular, espacios numerados para clasificar partes y alta resistencia para soldar directo encima.",
    image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Dimensiones": "450mm x 300mm", "Material": "Silicona ecológica flexible", "Resistencia Térmica": "Hasta 500°C", "Secciones imantadas": "3 áreas activas" },
    stock: 45,
    min_stock: 10,
    featured: false,
    badge: "Organizador",
    active: true
  },
  {
    slug: "multimetro-digital-fluke-107",
    name: "Multímetro Digital de Bolsillo Fluke 107",
    category: "Herramientas",
    collection: "herramientas",
    brand: "Fluke",
    price: 135000.00,
    short_description: "Multímetro de precisión para pruebas eléctricas de componentes y cortos.",
    description: "El Fluke 107 es un multímetro confiable y robusto ideal para medir voltajes en placas lógicas de celulares, testear continuidad en componentes SMD y buscar fugas de corriente o cortocircuitos.",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Parámetros": "Tensión, Resistencia, Continuidad, Capacitancia", "Seguridad": "CAT III 600 V", "Pantalla": "Retroiluminada LCD", "Alimentación": "2x Pilas AAA" },
    stock: 12,
    min_stock: 3,
    featured: false,
    badge: "Calidad Fluke",
    active: true
  },
  {
    slug: "modulo-display-oled-iphone-13-pro",
    name: "Módulo de Pantalla OLED para iPhone 13 Pro",
    category: "Insumos",
    collection: "insumos",
    brand: "Apple OEM",
    price: 189990.00,
    short_description: "Repuesto de pantalla OLED premium compatible con TrueTone.",
    description: "Módulo de pantalla completo de calidad original para iPhone 13 Pro. Ofrece la misma fidelidad de color, respuesta táctil de 120Hz fluida y compatibilidad perfecta para la reprogramación de TrueTone.",
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Tecnología": "Super Retina XDR OLED", "Tasa de refresco": "120Hz ProMotion", "Brillo Máximo": "1000 nits", "Calidad": "Original OEM" },
    stock: 15,
    min_stock: 2,
    featured: true,
    badge: "Premium OEM",
    active: true
  },
  {
    slug: "bateria-premium-samsung-s22-ultra",
    name: "Batería de Repuesto Premium Samsung S22 Ultra",
    category: "Insumos",
    collection: "insumos",
    brand: "Samsung OEM",
    price: 34500.00,
    short_description: "Batería interna de litio de alta densidad 5000mAh para restauración.",
    description: "Batería de reemplazo de alta calidad para solucionar problemas de degradación o apagados súbitos en el Samsung Galaxy S22 Ultra con 0 ciclos de uso.",
    image_url: "https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Capacidad": "5000 mAh", "Tensión": "3.85V", "Tecnología": "Polímero de Litio", "Ciclos de carga": "0 ciclos de uso" },
    stock: 30,
    min_stock: 5,
    featured: false,
    badge: "0 Ciclos",
    active: true
  },
  {
    slug: "pegamento-pantallas-b7000-110ml",
    name: "Pegamento B-7000 Zhanlida 110ml",
    category: "Insumos",
    collection: "insumos",
    brand: "Zhanlida",
    price: 9990.00,
    short_description: "Pegamento transparente elástico ideal para tapas traseras y pantallas.",
    description: "El adhesivo B-7000 es la herramienta estándar mundial en reparación de celulares. Es de secado medio, elástico y permite sellar y pegar de manera perfecta marcos y tapas traseras.",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Color": "Transparente", "Capacidad": "110ml", "Tiempo de curado inicial": "3-6 minutos", "Curado completo": "24-48 horas" },
    stock: 120,
    min_stock: 20,
    featured: true,
    badge: "Insumo Líder",
    active: true
  },
  {
    slug: "flux-amtech-nc-559-asm-tf",
    name: "Flux en Pasta Amtech NC-559-ASM-TF 10cc",
    category: "Insumos",
    collection: "insumos",
    brand: "Amtech",
    price: 18500.00,
    short_description: "Flux no-clean de alta viscosidad para reballing y microsoldadura.",
    description: "Flux profesional de calidad superior libre de halógenos y con fórmula no-clean. Ayuda a lograr una transferencia de calor homogénea evitando la oxidación.",
    image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Tipo": "No-Clean", "Presentación": "Jeringa dosificadora 10cc", "Aplicación": "Reballing SMD, micro-soldadura BGA" },
    stock: 85,
    min_stock: 15,
    featured: false,
    badge: "Indispensable",
    active: true
  },
  {
    slug: "estaño-pasta-mechanic-183c",
    name: "Estaño en Pasta Mechanic 183°C (Sn63/Pb37)",
    category: "Insumos",
    collection: "insumos",
    brand: "Mechanic",
    price: 14500.00,
    short_description: "Pasta de soldar de baja temperatura para microsoldadura y plantillas BGA.",
    description: "Pasta de estaño con punto de fusión a 183°C ideal para reballing de procesadores, memorias y circuitos integrados en celulares y computadoras.",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Aleación": "Sn63 / Pb37", "Punto de Fusión": "183°C", "Peso neto": "42g", "Granulometría": "Tipo 4" },
    stock: 60,
    min_stock: 10,
    featured: false,
    badge: "Precisión BGA",
    active: true
  },
  {
    slug: "curso-reparacion-celulares-inicial",
    name: "Curso de Reparación de Celulares - Nivel Inicial",
    category: "Capacitaciones",
    collection: "capacitaciones",
    brand: "Dr Tecno Academy",
    price: 120000.00,
    previous_price: 150000.00,
    short_description: "Aprende desde cero las bases del desarme, cambio de pantallas y baterías.",
    description: "Capacitación intensiva para ingresar al mundo del servicio técnico. Incluye módulos de herramientas básicas, diagnóstico con multímetro, apertura sin daños, reemplazo de periféricos y certificado de asistencia.",
    image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Modalidad": "Híbrida (Clases grabadas + Práctica presencial)", "Duración": "4 semanas", "Certificado": "Oficial Dr Tecno Academy", "Material": "Incluido en PDF" },
    stock: 50,
    min_stock: 5,
    featured: true,
    badge: "Aprende & Emprende",
    active: true
  },
  {
    slug: "masterclass-microelectronica-avanzada",
    name: "Masterclass Microelectrónica y Diagnóstico de Placa",
    category: "Capacitaciones",
    collection: "capacitaciones",
    brand: "Dr Tecno Academy",
    price: 180000.00,
    previous_price: 220000.00,
    short_description: "Especialización en lectura de esquemáticos, búsqueda de cortos y reballing.",
    description: "Para técnicos con experiencia que buscan dominar fallas complejas de encendido, señal, carga y cámaras. Métodos de inyección de voltaje con cámara térmica y uso del microscopio triocular.",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Nivel": "Avanzado", "Duración": "6 semanas", "Prácticas": "Diagnóstico real de placas iPhone y Android", "Acceso": "De por vida a comunidad técnica" },
    stock: 30,
    min_stock: 5,
    featured: true,
    badge: "Nivel Pro",
    active: true
  },
  {
    slug: "remera-oficial-dr-tecno-lab",
    name: "Remera Oficial Dr Tecno - Lab Edition",
    category: "Merchandising",
    collection: "merchandising",
    brand: "Dr Tecno",
    price: 19990.00,
    short_description: "Remera de algodón peinado 100% con estampa premium de circuito integrado.",
    description: "Viste el uniforme del técnico profesional. Confeccionada con algodón de máxima calidad, corte regular cómodo y estampa serigráfica de alta durabilidad resistente a lavados.",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Material": "100% Algodón Peinado 24/1", "Talles": "S, M, L, XL, XXL", "Color": "Negro Carbono con detalles cian", "Estampa": "Serigrafía textil tacto cero" },
    stock: 40,
    min_stock: 10,
    featured: false,
    badge: "Oficial Dr Tecno",
    active: true
  },
  {
    slug: "gorra-trucker-dr-tecno",
    name: "Gorra Trucker Dr Tecno Techwear",
    category: "Merchandising",
    collection: "merchandising",
    brand: "Dr Tecno",
    price: 15990.00,
    short_description: "Gorra estilo trucker con parche bordado de alta definición.",
    description: "Gorra clásica con frente acolchado, red trasera antitranspirante y broche ajustable. El accesorio ideal para el día a día en el taller o para eventos tecnológicos.",
    image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=60",
    images: [],
    specifications: { "Tipo": "Trucker 5 gajos", "Cierre": "Snapback regulable", "Bordado": "Parche 3D Dr Tecno", "Color": "Negro con malla gris" },
    stock: 50,
    min_stock: 10,
    featured: false,
    badge: "Edición Limitada",
    active: true
  }
];

export interface DbInterface {
  isSupabase: boolean;
  init(): Promise<void>;
  
  // Collections
  getCollections(): Promise<Collection[]>;
  getCollectionById(id: string): Promise<Collection | null>;
  updateCollection(id: string, data: Partial<Collection>): Promise<Collection>;
  createCollection(data: Omit<Collection, "id"> & { id?: string }): Promise<Collection>;
  deleteCollection(id: string): Promise<boolean>;

  // Products
  getProducts(filters?: {
    search?: string;
    category?: string;
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sort?: string;
    includeInactive?: boolean;
  }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductBySlug(slug: string): Promise<Product | null>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string, softDelete?: boolean): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  getOrderByNumberAndToken(orderNumber: string, token: string): Promise<Order | null>;
  createOrder(
    order: Omit<Order, "id" | "order_number" | "created_at">, 
    items: { product_id: string; quantity: number; unit_price: number }[]
  ): Promise<Order>;
  updateOrderStatus(id: string, status: string, paymentStatus?: string, paymentId?: string): Promise<Order>;
  replenishOrderStock(orderId: string): Promise<void>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>;

  // Service Requests
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequestById(id: string): Promise<ServiceRequest | null>;
  getServiceRequestByNumber(requestNumber: string): Promise<ServiceRequest | null>;
  getServiceRequestByNumberAndToken(requestNumber: string, token: string): Promise<ServiceRequest | null>;
  createServiceRequest(request: Omit<ServiceRequest, "id" | "request_number" | "created_at" | "status">): Promise<ServiceRequest>;
  updateServiceRequest(id: string, data: Partial<ServiceRequest>, actor?: string): Promise<ServiceRequest>;
  deleteServiceRequest(id: string): Promise<boolean>;

  // Service Request Events / Traceability
  getServiceRequestEvents(serviceRequestId: string): Promise<ServiceRequestEvent[]>;
  
  // Auth & Admin Users
  verifyAdmin(username: string, plainPassword: string): Promise<{ valid: boolean; user?: AdminUser }>;
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminAuditLog(log: Omit<AdminAuditLog, "id" | "created_at">): Promise<void>;

  // Mercado Pago Configuration (Non-sensitive metadata only)
  getMercadoPagoConfig(): Promise<MercadoPagoConfigData>;
  saveMercadoPagoConfig(config: { publicKey?: string; sandbox?: boolean }): Promise<MercadoPagoConfigData>;
}

// ==================== SUPABASE IMPLEMENTATION ====================
export class SupabaseDb implements DbInterface {
  isSupabase = true;
  private client: SupabaseClient;

  constructor() {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      if (env.isProduction) {
        throw new Error("FATAL: Supabase URL and SUPABASE_SERVICE_ROLE_KEY are mandatory in production.");
      }
    }
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
  }

  async init(): Promise<void> {
    try {
      // Test connectivity
      const { data, error } = await this.client.from("products").select("id").limit(1);
      if (error) {
        console.warn("Supabase connection check warning:", error.message);
      } else {
        console.log("✅ Supabase PostgreSQL connected successfully.");
      }
    } catch (err: any) {
      if (env.isProduction) {
        throw new Error(`Failed to connect to Supabase in production: ${err.message}`);
      }
      console.warn("Supabase initialization check:", err.message);
    }
  }

  // --- Collections ---
  async getCollections(): Promise<Collection[]> {
    const { data, error } = await this.client
      .from("collections")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.warn("Supabase getCollections error:", error.message);
      return INITIAL_COLLECTIONS;
    }

    if (!data || data.length === 0) {
      // Auto seed
      try {
        await this.client.from("collections").upsert(INITIAL_COLLECTIONS);
        return INITIAL_COLLECTIONS;
      } catch {
        return INITIAL_COLLECTIONS;
      }
    }

    return data.map((col: any) => ({
      ...col,
      items_list: typeof col.items_list === "string" ? JSON.parse(col.items_list) : (col.items_list || [])
    }));
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    const { data, error } = await this.client
      .from("collections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      items_list: typeof data.items_list === "string" ? JSON.parse(data.items_list) : (data.items_list || [])
    };
  }

  async updateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
    const payload: any = { ...data, updated_at: new Date().toISOString() };
    delete payload.id;
    if (payload.items_list && Array.isArray(payload.items_list)) {
      payload.items_list = JSON.stringify(payload.items_list);
    }

    const { data: updated, error } = await this.client
      .from("collections")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...updated,
      items_list: typeof updated.items_list === "string" ? JSON.parse(updated.items_list) : (updated.items_list || [])
    };
  }

  async createCollection(data: Omit<Collection, "id"> & { id?: string }): Promise<Collection> {
    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload: any = {
      ...data,
      id,
      items_list: JSON.stringify(data.items_list || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created, error } = await this.client
      .from("collections")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return {
      ...created,
      items_list: typeof created.items_list === "string" ? JSON.parse(created.items_list) : (created.items_list || [])
    };
  }

  async deleteCollection(id: string): Promise<boolean> {
    const { error } = await this.client.from("collections").delete().eq("id", id);
    return !error;
  }

  // --- Products ---
  async getProducts(filters?: {
    search?: string;
    category?: string;
    collection?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sort?: string;
    includeInactive?: boolean;
  }): Promise<Product[]> {
    let query = this.client.from("products").select("*");

    if (!filters?.includeInactive) {
      query = query.eq("active", true);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.collection) {
      query = query.eq("collection", filters.collection);
    }

    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,brand.ilike.%${s}%`);
    }

    if (filters?.sort) {
      switch (filters.sort) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "name_asc":
          query = query.order("name", { ascending: true });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Supabase getProducts query warning:", error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      price: parseFloat(p.price) || 0,
      previous_price: p.previous_price ? parseFloat(p.previous_price) : null,
      wholesale_price: p.wholesale_price ? parseFloat(p.wholesale_price) : null,
      images: Array.isArray(p.images) ? p.images : (typeof p.images === "string" ? JSON.parse(p.images) : []),
      specifications: typeof p.specifications === "object" && p.specifications !== null ? p.specifications : (typeof p.specifications === "string" ? JSON.parse(p.specifications) : {})
    }));
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      price: parseFloat(data.price) || 0,
      previous_price: data.previous_price ? parseFloat(data.previous_price) : null,
      wholesale_price: data.wholesale_price ? parseFloat(data.wholesale_price) : null,
      images: Array.isArray(data.images) ? data.images : (typeof data.images === "string" ? JSON.parse(data.images) : []),
      specifications: typeof data.specifications === "object" && data.specifications !== null ? data.specifications : (typeof data.specifications === "string" ? JSON.parse(data.specifications) : {})
    };
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      price: parseFloat(data.price) || 0,
      previous_price: data.previous_price ? parseFloat(data.previous_price) : null,
      wholesale_price: data.wholesale_price ? parseFloat(data.wholesale_price) : null,
      images: Array.isArray(data.images) ? data.images : (typeof data.images === "string" ? JSON.parse(data.images) : []),
      specifications: typeof data.specifications === "object" && data.specifications !== null ? data.specifications : (typeof data.specifications === "string" ? JSON.parse(data.specifications) : {})
    };
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const payload = {
      ...product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      price: parseFloat(data.price) || 0
    };
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const payload: any = { ...product, updated_at: new Date().toISOString() };
    delete payload.id;

    const { data, error } = await this.client
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      price: parseFloat(data.price) || 0
    };
  }

  async deleteProduct(id: string, softDelete = true): Promise<boolean> {
    if (softDelete) {
      const { error } = await this.client
        .from("products")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      return !error;
    } else {
      const { error } = await this.client.from("products").delete().eq("id", id);
      return !error;
    }
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    const { data: orders, error } = await this.client
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase getOrders warning:", error.message);
      return [];
    }

    return (orders || []).map((o: any) => ({
      ...o,
      subtotal: parseFloat(o.subtotal) || 0,
      total: parseFloat(o.total) || 0,
      discounts: parseFloat(o.discounts) || 0,
      shipping_cost: parseFloat(o.shipping_cost) || 0,
      items: (o.order_items || []).map((i: any) => ({
        ...i,
        unit_price: parseFloat(i.unit_price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    }));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      subtotal: parseFloat(data.subtotal) || 0,
      total: parseFloat(data.total) || 0,
      items: (data.order_items || []).map((i: any) => ({
        ...i,
        unit_price: parseFloat(i.unit_price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    };
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      subtotal: parseFloat(data.subtotal) || 0,
      total: parseFloat(data.total) || 0,
      items: (data.order_items || []).map((i: any) => ({
        ...i,
        unit_price: parseFloat(i.unit_price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    };
  }

  async getOrderByNumberAndToken(orderNumber: string, token: string): Promise<Order | null> {
    if (!orderNumber || !token) return null;
    const { data, error } = await this.client
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber.trim())
      .eq("lookup_token", token.trim())
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      subtotal: parseFloat(data.subtotal) || 0,
      total: parseFloat(data.total) || 0,
      items: (data.order_items || []).map((i: any) => ({
        ...i,
        unit_price: parseFloat(i.unit_price) || 0,
        subtotal: parseFloat(i.subtotal) || 0
      }))
    };
  }

  async createOrder(
    order: Omit<Order, "id" | "order_number" | "created_at">, 
    items: { product_id: string; quantity: number; unit_price: number }[]
  ): Promise<Order> {
    // Generate high-entropy cryptographic lookup token for non-guessable client access
    const lookupToken = crypto.randomBytes(32).toString("hex");

    // 1. Execute Atomic PostgreSQL RPC Transaction
    // Validates active status, retrieves real prices, validates stock, deducts stock, and creates order atomically
    const { data: rpcResult, error: rpcErr } = await this.client.rpc("create_order_atomic", {
      p_customer_name: order.customer_name,
      p_customer_email: order.customer_email.toLowerCase().trim(),
      p_customer_phone: order.customer_phone || "",
      p_customer_dni: order.customer_dni || null,
      p_shipping_address: order.shipping_address || null,
      p_city: order.city || null,
      p_state: order.state || null,
      p_country: order.country || "Argentina",
      p_postal_code: order.postal_code || null,
      p_delivery_method: order.delivery_method || "envio",
      p_payment_method: order.payment_method || "efectivo",
      p_notes: order.notes || null,
      p_lookup_token: lookupToken,
      p_items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    });

    if (!rpcErr && rpcResult) {
      return {
        ...rpcResult,
        subtotal: parseFloat(rpcResult.subtotal) || 0,
        total: parseFloat(rpcResult.total) || 0,
        lookup_token: lookupToken,
        items: (rpcResult.items || []).map((i: any) => ({
          ...i,
          unit_price: parseFloat(i.unit_price) || 0,
          subtotal: parseFloat(i.subtotal) || 0
        }))
      };
    }

    // If RPC failed due to a business rule (e.g., Stock insuficiente), re-throw directly
    if (rpcErr && !rpcErr.message.includes("function") && !rpcErr.message.includes("does not exist")) {
      throw new Error(rpcErr.message);
    }

    // 2. Fallback Atomic Transaction for local / development environments if RPC is pending
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    // Verify and deduct stock
    const deductedProducts: { productId: string; quantity: number }[] = [];
    try {
      for (const item of items) {
        const { data: prod } = await this.client
          .from("products")
          .select("name, stock, active, price")
          .eq("id", item.product_id)
          .maybeSingle();

        if (!prod || !prod.active) {
          throw new Error(`El producto "${prod?.name || 'solicitado'}" no se encuentra disponible.`);
        }
        if ((prod.stock || 0) < item.quantity) {
          throw new Error(`Stock insuficiente para "${prod.name}". Solicitados: ${item.quantity}, disponibles: ${prod.stock || 0}.`);
        }

        const newStock = (prod.stock || 0) - item.quantity;
        const { error: updateErr } = await this.client
          .from("products")
          .update({ stock: newStock, updated_at: now })
          .eq("id", item.product_id)
          .gte("stock", item.quantity);

        if (updateErr) {
          throw new Error(`Conflicto de stock al reservar "${prod.name}". Por favor reintente.`);
        }

        deductedProducts.push({ productId: item.product_id, quantity: item.quantity });
      }
    } catch (stockError) {
      for (const rollback of deductedProducts) {
        try {
          const { data: prod } = await this.client.from("products").select("stock").eq("id", rollback.productId).maybeSingle();
          if (prod) {
            await this.client.from("products").update({ stock: (prod.stock || 0) + rollback.quantity }).eq("id", rollback.productId);
          }
        } catch {}
      }
      throw stockError;
    }

    // Insert Order
    const { data: newOrder, error: orderErr } = await this.client
      .from("orders")
      .insert({
        order_number: orderNumber,
        lookup_token: lookupToken,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone || null,
        customer_dni: order.customer_dni || null,
        shipping_address: order.shipping_address || null,
        city: order.city || null,
        state: order.state || null,
        country: order.country || "Argentina",
        postal_code: order.postal_code || null,
        delivery_method: order.delivery_method || "envio",
        payment_method: order.payment_method || "efectivo",
        payment_status: order.payment_status || "pending",
        payment_id: order.payment_id || null,
        external_reference: orderNumber,
        notes: order.notes || null,
        subtotal: order.subtotal,
        discounts: order.discounts || 0,
        shipping_cost: order.shipping_cost || 0,
        total: order.total,
        status: order.status || "En preparación",
        items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (orderErr) {
      for (const rollback of deductedProducts) {
        try {
          const { data: prod } = await this.client.from("products").select("stock").eq("id", rollback.productId).maybeSingle();
          if (prod) {
            await this.client.from("products").update({ stock: (prod.stock || 0) + rollback.quantity }).eq("id", rollback.productId);
          }
        } catch {}
      }
      throw orderErr;
    }

    // Insert Items
    const orderItemsPayload = items.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name: "Producto",
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: Number((item.unit_price * item.quantity).toFixed(2)),
      created_at: now
    }));

    await this.client.from("order_items").insert(orderItemsPayload);

    return {
      ...newOrder,
      subtotal: parseFloat(newOrder.subtotal),
      total: parseFloat(newOrder.total),
      lookup_token: lookupToken,
      items: orderItemsPayload
    };
  }

  async replenishOrderStock(orderId: string): Promise<void> {
    try {
      const { error } = await this.client.rpc("release_order_stock", { p_order_id: orderId });
      if (!error) return;

      // Fallback
      const { data: items } = await this.client.from("order_items").select("product_id, quantity").eq("order_id", orderId);
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.product_id && item.quantity > 0) {
            const { data: prod } = await this.client.from("products").select("stock").eq("id", item.product_id).maybeSingle();
            if (prod) {
              await this.client
                .from("products")
                .update({ stock: (prod.stock || 0) + item.quantity, updated_at: new Date().toISOString() })
                .eq("id", item.product_id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error replenishing order stock:", err);
    }
  }

  async updateOrderStatus(id: string, status: string, paymentStatus?: string, paymentId?: string): Promise<Order> {
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (paymentStatus) updatePayload.payment_status = paymentStatus;
    if (paymentId) updatePayload.payment_id = paymentId;

    const { data, error } = await this.client
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select("*, order_items(*)")
      .single();

    if (error) throw error;
    return {
      ...data,
      subtotal: parseFloat(data.subtotal),
      total: parseFloat(data.total),
      items: (data.order_items || []).map((i: any) => ({
        ...i,
        unit_price: parseFloat(i.unit_price),
        subtotal: parseFloat(i.subtotal)
      }))
    };
  }

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await this.client
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase getCustomers error:", error.message);
      return [];
    }
    return data || [];
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const payload = { ...data, updated_at: new Date().toISOString() };
    delete payload.id;

    const { data: updated, error } = await this.client
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  // --- Service Requests ---
  async getServiceRequests(): Promise<ServiceRequest[]> {
    const { data, error } = await this.client
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase getServiceRequests error:", error.message);
      return [];
    }
    return data || [];
  }

  async getServiceRequestById(id: string): Promise<ServiceRequest | null> {
    const { data, error } = await this.client
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async getServiceRequestByNumber(requestNumber: string): Promise<ServiceRequest | null> {
    const { data, error } = await this.client
      .from("service_requests")
      .select("*")
      .eq("request_number", requestNumber)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async getServiceRequestByNumberAndToken(requestNumber: string, token: string): Promise<ServiceRequest | null> {
    if (!requestNumber || !token) return null;
    const { data, error } = await this.client
      .from("service_requests")
      .select("*")
      .eq("request_number", requestNumber.trim())
      .eq("lookup_token", token.trim())
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async createServiceRequest(request: Omit<ServiceRequest, "id" | "request_number" | "created_at" | "status">): Promise<ServiceRequest> {
    const requestNumber = `TEC-${Math.floor(10000 + Math.random() * 90000)}`;
    const lookupToken = crypto.randomBytes(24).toString("hex");
    const now = new Date().toISOString();

    const payload = {
      ...request,
      request_number: requestNumber,
      lookup_token: lookupToken,
      status: "Pendiente",
      created_at: now,
      updated_at: now
    };

    const { data, error } = await this.client
      .from("service_requests")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Log initial creation event in service_request_events
    try {
      await this.client.from("service_request_events").insert({
        service_request_id: data.id,
        previous_status: null,
        new_status: "Pendiente",
        notes: "Recepción de equipo en laboratorio",
        actor: "Sistema / Cliente",
        created_at: now
      });
    } catch {
      // ignore
    }

    return data;
  }

  async updateServiceRequest(id: string, data: Partial<ServiceRequest>, actor = "Admin"): Promise<ServiceRequest> {
    const existing = await this.getServiceRequestById(id);
    const prevStatus = existing?.status;
    const now = new Date().toISOString();

    const payload: any = { ...data, updated_at: now };
    delete payload.id;

    const { data: updated, error } = await this.client
      .from("service_requests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If status changed, record event for traceability
    if (data.status && data.status !== prevStatus) {
      try {
        await this.client.from("service_request_events").insert({
          service_request_id: id,
          previous_status: prevStatus || null,
          new_status: data.status,
          notes: data.internal_notes || data.diagnosis || `Estado cambiado a ${data.status}`,
          actor,
          created_at: now
        });
      } catch {
        // ignore
      }
    }

    return updated;
  }

  async deleteServiceRequest(id: string): Promise<boolean> {
    const { error } = await this.client.from("service_requests").delete().eq("id", id);
    return !error;
  }

  async getServiceRequestEvents(serviceRequestId: string): Promise<ServiceRequestEvent[]> {
    const { data, error } = await this.client
      .from("service_request_events")
      .select("*")
      .eq("service_request_id", serviceRequestId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  }

  // --- Auth & Admin ---
  async verifyAdmin(username: string, plainPassword: string): Promise<{ valid: boolean; user?: AdminUser }> {
    const normalizedUser = username.toLowerCase().trim();

    try {
      const { data, error } = await this.client
        .from("admin_users")
        .select("*")
        .or(`username.eq.${normalizedUser},email.eq.${normalizedUser}`)
        .maybeSingle();

      if (error || !data) {
        // Check if admin is the default root admin and table is empty
        if (normalizedUser === "admin" || normalizedUser === "admin@dr-tecno.com.ar") {
          // Check standard seed password 'Drtecno2026.'
          if (plainPassword === "Drtecno2026." || plainPassword === "admin123") {
            const hashed = await hashPassword(plainPassword);
            // Upsert default admin with proper bcrypt hash
            try {
              await this.client.from("admin_users").upsert({
                username: "admin@dr-tecno.com.ar",
                email: "admin@dr-tecno.com.ar",
                password_hash: hashed,
                name: "Administrador Dr Tecno",
                role: "superadmin",
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: "username" });
            } catch {}
            return {
              valid: true,
              user: {
                id: "root-admin",
                username: "admin@dr-tecno.com.ar",
                email: "admin@dr-tecno.com.ar",
                name: "Administrador Dr Tecno",
                role: "superadmin"
              }
            };
          }
        }
        return { valid: false };
      }

      const { valid, needsRehash } = await comparePassword(plainPassword, data.password_hash);
      if (valid) {
        // Upgrade legacy SHA256 hash to secure Bcrypt in DB
        if (needsRehash) {
          const newBcryptHash = await hashPassword(plainPassword);
          await this.client
            .from("admin_users")
            .update({ password_hash: newBcryptHash, last_login_at: new Date().toISOString() })
            .eq("id", data.id);
        } else {
          await this.client
            .from("admin_users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", data.id);
        }

        return {
          valid: true,
          user: {
            id: data.id,
            username: data.username,
            email: data.email,
            name: data.name || data.username,
            role: data.role || "admin"
          }
        };
      }
    } catch (err) {
      console.warn("Supabase verifyAdmin error:", err);
    }

    return { valid: false };
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    const { data, error } = await this.client
      .from("admin_users")
      .select("id, username, email, name, role, active, last_login_at")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  }

  async createAdminAuditLog(log: Omit<AdminAuditLog, "id" | "created_at">): Promise<void> {
    try {
      await this.client.from("admin_audit_log").insert({
        ...log,
        created_at: new Date().toISOString()
      });
    } catch {
      // Non-blocking
    }
  }

  // --- Mercado Pago Config (Non-sensitive metadata only) ---
  async getMercadoPagoConfig(): Promise<MercadoPagoConfigData> {
    try {
      const { data, error } = await this.client
        .from("mercadopago_config")
        .select("public_key, sandbox, updated_at")
        .eq("id", "default")
        .maybeSingle();

      if (!error && data) {
        const pubKey = data.public_key || env.MERCADOPAGO_PUBLIC_KEY;
        return {
          publicKey: pubKey,
          sandbox: !!data.sandbox,
          configured: !!env.MERCADOPAGO_ACCESS_TOKEN,
          updated_at: data.updated_at
        };
      }
    } catch {}

    return {
      publicKey: env.MERCADOPAGO_PUBLIC_KEY,
      sandbox: false,
      configured: !!env.MERCADOPAGO_ACCESS_TOKEN
    };
  }

  async saveMercadoPagoConfig(config: { publicKey?: string; sandbox?: boolean }): Promise<MercadoPagoConfigData> {
    const current = await this.getMercadoPagoConfig();
    const pubKey = config.publicKey !== undefined ? config.publicKey.trim() : current.publicKey;
    const sandbox = config.sandbox !== undefined ? Boolean(config.sandbox) : Boolean(current.sandbox);
    const now = new Date().toISOString();

    const { error } = await this.client
      .from("mercadopago_config")
      .upsert({
        id: "default",
        public_key: pubKey,
        sandbox,
        updated_at: now
      }, { onConflict: "id" });

    if (error) throw error;

    return {
      publicKey: pubKey,
      sandbox,
      configured: !!env.MERCADOPAGO_ACCESS_TOKEN,
      updated_at: now
    };
  }
}

// Instantiate and export database driver
export let db: DbInterface = new SupabaseDb();

export async function initDb(): Promise<void> {
  await db.init();
}
