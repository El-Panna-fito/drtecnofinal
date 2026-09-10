import { generateObject } from "ai";
import { z } from "zod";
import { Product, ServiceRequest } from "../../src/types.js";

// AI generation runs through the Vercel AI Gateway (zero-config auth in the v0
// preview and on Vercel). Using a plain gateway model id avoids depending on a
// provider API key. The previously configured Gemini key was denied access.
const AI_MODEL = "google/gemini-2.5-flash";

export interface ChatMessage {
  sender: "bot" | "user";
  text: string;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  short_description?: string | null;
  inStock: boolean;
}

export interface ChatResult {
  reply: string;
  recommendedProducts: ProductSummary[];
  quickReplies: string[];
  ticketDetails?: ServiceRequest | null;
  ticketMetadata?: any;
  whatsappUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
}

// Tech Synonyms Map for flexible search without exact product names
const TECH_SYNONYMS: Record<string, string[]> = {
  soldadura: ["soldador", "cautin", "cautín", "estacion", "estación", "sugon", "t26", "estaño", "estano", "flux", "pasta", "soldar", "desoldar", "puntas", "c210"],
  microscopio: ["microscopio", "triocular", "lupa", "aumento", "zoom", "relife", "rl-m3t", "camara", "cámara", "hdmi", "luz led", "ver pistas", "placa"],
  herramientas: ["destornillador", "destornilladores", "ifixit", "puntas", "torx", "pentalobe", "abrir", "desarmar", "pinzas", "espatula", "espátula", "kit", "manta", "antiestatica", "antiestática", "s160", "organizador", "imantada"],
  medicion: ["multimetro", "multímetro", "tester", "fluke", "107", "medir", "voltaje", "corriente", "continuidad", "corto", "cortocircuito", "fuga", "componentes"],
  pantallas: ["pantalla", "modulo", "módulo", "display", "oled", "touch", "tactil", "táctil", "vidrio", "rotura", "iphone", "13 pro", "pegamento", "b7000", "adhesivo", "sellar"],
  baterias: ["bateria", "batería", "pila", "carga", "descarga", "samsung", "s22", "ultra", "5000mah", "ciclos", "dura poco", "apaga"],
  insumos: ["pegamento", "b-7000", "b7000", "zhanlida", "flux", "amtech", "nc-559", "estaño", "pasta", "mechanic", "183", "reballing", "bga", "smd", "quimicos", "limpieza"],
  cursos: ["curso", "cursos", "capacitacion", "capacitación", "aprender", "estudiar", "taller", "clases", "formacion", "formación", "inicial", "basico", "básico", "microelectronica", "microelectrónica", "masterclass", "esquematicos", "esquemáticos", "salida laboral"],
  merch: ["remera", "gorra", "remeras", "gorras", "ropa", "indumentaria", "taza", "lab", "trucker", "oficial", "dr tecno"]
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const STOP_WORDS = new Set([
  "hola", "buen", "buenos", "buenas", "dias", "tardes", "noches", "que", "como", "cual", "cuales", 
  "donde", "cuando", "quien", "por", "para", "con", "sin", "sobre", "entre", "hacia", "desde", 
  "hasta", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas", "aquel", "aquella", 
  "los", "las", "les", "una", "uno", "unos", "unas", "del", "al", "algo", "algun", "alguna", 
  "algunos", "algunas", "todo", "toda", "todos", "todas", "otro", "otra", "otros", "otras", 
  "hacen", "hacer", "hace", "tienen", "tenes", "tene", "venden", "vende", "busco", "buscando", 
  "quiero", "necesito", "tengo", "hay", "sirve", "puedo", "podria", "favor", "gracias"
]);

/**
 * Fallback semantic matching when Gemini is offline or not configured.
 * Evaluates semantic overlaps, synonyms, and natural intent.
 */
function fallbackSemanticSearch(query: string, products: Product[]): { reply: string; matchedProducts: ProductSummary[]; quickReplies: string[] } {
  const normQuery = normalizeString(query);

  // 1. Direct General Intents (FAQ)
  const isGreeting = /^(hola|buen dia|buenas tardes|buenas noches|que tal|hola talos|buenas)\b/i.test(normQuery);
  const isPayment = (normQuery.includes("pago") || normQuery.includes("tarjeta") || normQuery.includes("cuotas") || normQuery.includes("transferencia") || normQuery.includes("mercado pago") || normQuery.includes("efectivo")) && !normQuery.includes("cuanto sale");
  const isShipping = (normQuery.includes("envio") || normQuery.includes("envios") || normQuery.includes("correo") || normQuery.includes("despacho") || normQuery.includes("entrega") || normQuery.includes("demora")) && !normQuery.includes("pantalla");
  const isLocation = normQuery.includes("donde estan") || normQuery.includes("ubicacion") || normQuery.includes("sucursal") || normQuery.includes("direccion") || normQuery.includes("local");
  const isWarranty = normQuery.includes("garantia") || normQuery.includes("garantias") || normQuery.includes("devolucion") || normQuery.includes("cambio directo");
  const isService = (normQuery.includes("servicio tecnico") || normQuery.includes("reparar") || normQuery.includes("reparacion") || normQuery.includes("presupuesto") || normQuery.includes("taller")) && !normQuery.includes("curso");

  const queryWords = normQuery.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Score each product
  const scoredProducts: Array<{ product: Product; score: number; matchReasons: string[] }> = [];

  for (const prod of products) {
    let score = 0;
    const matchReasons: string[] = [];
    const prodNameNorm = normalizeString(prod.name);
    const prodDescNorm = normalizeString((prod.short_description || "") + " " + (prod.description || ""));
    const prodCatNorm = normalizeString(prod.category || "");
    const prodBrandNorm = normalizeString(prod.brand || "");

    // 1. Direct substrings
    if (normQuery.includes(prodNameNorm) || (prodNameNorm.length > 5 && prodNameNorm.includes(normQuery))) {
      score += 60;
      matchReasons.push("Coincidencia de nombre");
    }

    // 2. Word matches with stopwords stripped
    for (const word of queryWords) {
      if (prodNameNorm.includes(word)) {
        score += 30;
        matchReasons.push(`Palabra '${word}' en título`);
      } else if (prodCatNorm.includes(word)) {
        score += 15;
        matchReasons.push(`Categoría '${prod.category}'`);
      } else if (prodBrandNorm.includes(word)) {
        score += 20;
        matchReasons.push(`Marca '${prod.brand}'`);
      } else if (prodDescNorm.includes(word)) {
        score += 10;
      }
    }

    // 3. Synonym matches
    for (const [, synList] of Object.entries(TECH_SYNONYMS)) {
      const userHasSynonym = synList.some(s => normQuery.includes(normalizeString(s)));
      if (userHasSynonym) {
        const prodHasSynonym = synList.some(s => 
          prodNameNorm.includes(normalizeString(s)) || 
          prodDescNorm.includes(normalizeString(s)) || 
          prodCatNorm.includes(normalizeString(s))
        );
        if (prodHasSynonym) {
          score += 35;
          matchReasons.push("Relación temática con tu búsqueda");
        }
      }
    }

    // Boost in-stock and featured items
    if (prod.stock > 0) score += 5;
    if (prod.featured) score += 5;

    if (score >= 25) {
      scoredProducts.push({ product: prod, score, matchReasons });
    }
  }

  // Sort descending by score
  scoredProducts.sort((a, b) => b.score - a.score);
  const topMatches = scoredProducts.slice(0, 3).map(sp => ({
    id: sp.product.id,
    slug: sp.product.slug,
    name: sp.product.name,
    price: sp.product.price,
    category: sp.product.category,
    image_url: sp.product.image_url,
    badge: sp.product.badge,
    short_description: sp.product.short_description || sp.product.description,
    inStock: (sp.product.stock || 0) > 0
  }));

  // Build responsive conversational reply
  let reply = "";
  let quickReplies: string[] = ["Ver catálogo completo", "Medios de pago", "Consultar servicio técnico"];

  if (topMatches.length > 0) {
    if (topMatches.length === 1) {
      reply = `¡Encontré la opción ideal para lo que necesitás! Te recomiendo **${topMatches[0].name}** ($${topMatches[0].price.toLocaleString("es-AR")}). ${topMatches[0].short_description || "Excelente calidad garantizada por Dr Tecno."}`;
    } else {
      reply = `¡Claro! Tenemos varias opciones ideales para lo que estás buscando. Te recomiendo especialmente estas ${topMatches.length} alternativas de nuestro catálogo:`;
    }
  } else if (isPayment) {
    reply = "Aceptamos todas las tarjetas de crédito y débito a través de **Mercado Pago**, transferencia bancaria directa (con un **10% de descuento automático**) y efectivo contra entrega en nuestra sucursal de Paraná. 💳⚡";
    quickReplies = ["¿Hacen envíos?", "Ver catálogo", "Garantía"];
  } else if (isShipping) {
    reply = "¡Hacemos envíos a todo el país! 🚚 Despachamos por Correo Argentino con código de seguimiento, o podés retirar sin cargo en nuestra sucursal de Paraná.";
    quickReplies = ["Medios de pago", "Ver catálogo", "Sucursal física"];
  } else if (isLocation) {
    reply = "Nuestro laboratorio central y tienda física está ubicada en **Gualeguaychú 595, Paraná, Entre Ríos**. Atendemos de lunes a viernes de 09:00 a 18:00 hs y sábados de 09:00 a 13:00 hs. 📍";
    quickReplies = ["Servicio Técnico", "¿Hacen envíos?", "Ver productos"];
  } else if (isWarranty) {
    reply = "Todas nuestras ventas y reparaciones cuentan con **garantía escrita de 30 días**. Priorizamos repuestos originales, sobre todo en la alta gama, y en el resto usamos alternativos de calidad probados. 🛡️";
    quickReplies = ["Medios de pago", "Envíos a todo el país", "Ver catálogo"];
  } else if (isService) {
    reply = "Contamos con laboratorio propio de alta precisión para celulares y computadoras. Podés registrar tu solicitud online en **Servicio Técnico**, seguir tu ticket en tiempo real o traer tu equipo a **Gualeguaychú 595, Paraná**.";
    quickReplies = ["Ir a Servicio Técnico", "Estado de mi ticket", "Hablar con un técnico"];
  } else if (isGreeting) {
    reply = "¡Hola! Soy **Talos**, tu asesor en Dr Tecno. 👋 Contame qué tipo de trabajo querés realizar, qué dispositivo querés reparar o qué herramienta estás buscando y te guiaré con las mejores opciones.";
    quickReplies = ["Soldadores y estaciones", "Herramientas de desarme", "Insumos y repuestos", "Capacitaciones"];
  } else {
    reply = "¡Hola! Soy **Talos**, tu asesor en Dr Tecno. Contame qué tipo de trabajo querés realizar, qué dispositivo querés reparar o qué herramienta estás buscando y te guiaré con las mejores recomendaciones de nuestro catálogo.";
  }

  return { reply, matchedProducts: topMatches, quickReplies };
}

/**
 * Parses clean notes from service ticket internal notes JSON or plain string
 */
export function extractCleanNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const trimmed = notes.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.plain_notes?.trim() || null;
    } catch {
      return notes;
    }
  }
  return notes;
}

export function parseServiceMetadata(internalNotes: string | null | undefined) {
  if (!internalNotes) {
    return {
      physical_received: false,
      received_image: "",
      repaired_image: "",
      diagnosis_history: [],
      plain_notes: ""
    };
  }
  const trimmed = internalNotes.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        physical_received: !!parsed.physical_received,
        received_image: parsed.received_image || "",
        repaired_image: parsed.repaired_image || "",
        diagnosis_history: parsed.diagnosis_history || [],
        plain_notes: parsed.plain_notes || ""
      };
    } catch {
      // ignore
    }
  }
  return {
    physical_received: false,
    received_image: "",
    repaired_image: "",
    diagnosis_history: [],
    plain_notes: internalNotes
  };
}

/**
 * Main chat handler powered by Gemini 3.7 Flash with Live Catalog Context
 */
export async function processChatQuery(params: {
  message: string;
  history?: ChatMessage[];
  aiEnabled: boolean;
  db: {
    getProducts: (filters?: any) => Promise<Product[]>;
    getServiceRequestByNumber?: (ticket: string) => Promise<ServiceRequest | null>;
  };
}): Promise<ChatResult> {
  const { message, history = [], aiEnabled, db } = params;
  const cleanMessage = message.trim();

  // 1. Check for Service Ticket query pattern (e.g. TEC-1001, TEC-77908)
  const ticketMatch = cleanMessage.match(/TEC-\d+/i);
  if (ticketMatch && db.getServiceRequestByNumber) {
    const ticketNumber = ticketMatch[0].toUpperCase();
    try {
      const ticket = await db.getServiceRequestByNumber(ticketNumber);
      if (ticket) {
        const statusLabels: Record<string, string> = {
          "recibido": "Equipo Recibido / Ingresado al Laboratorio 📦",
          "en_diagnostico": "En Diagnóstico Técnico 🔬",
          "presupuestado": "Presupuestado (Esperando tu aprobación) 📋",
          "en_reparacion": "En Reparación en Taller 🛠️",
          "listo_para_entregar": "Listo para Entregar / Retirar ✅",
          "entregado": "Dispositivo Entregado con éxito 🎉"
        };
        const statusText = statusLabels[ticket.status?.toLowerCase()] || ticket.status;
        const brandModel = [ticket.brand, ticket.model].filter(Boolean).join(" ") || ticket.device_type;
        const cleanNotes = ticket.public_notes || ticket.diagnosis || extractCleanNotes(ticket.internal_notes);
        const reply = `🛠️ **Estado de Reparación para Ticket ${ticket.request_number}**:\n\n` +
          `• **Cliente:** ${ticket.customer_name}\n` +
          `• **Dispositivo:** ${brandModel}\n` +
          `• **Falla Reportada:** ${ticket.problem_description}\n` +
          `• **Estado Actual:** ${statusText}` +
          (cleanNotes ? `\n• **Notas de Diagnóstico:** ${cleanNotes}` : "");

        const ticketMetadata = parseServiceMetadata(ticket.internal_notes);

        return {
          reply,
          recommendedProducts: [],
          quickReplies: ["Ver Servicio Técnico", "¿Cuánto demora una reparación?", "Hablar con un técnico"],
          ticketDetails: ticket,
          ticketMetadata
        };
      } else {
        return {
          reply: `No se encontró ningún ticket de servicio técnico con el número **${ticketNumber}**. Por favor, verificá que esté escrito correctamente (ej: TEC-1001) o consultalo en nuestra sección de Servicio Técnico.`,
          recommendedProducts: [],
          quickReplies: ["Ir a Servicio Técnico", "Registrar nuevo turno"],
          actionUrl: "/servicio-tecnico",
          actionLabel: "Ir a Servicio Técnico"
        };
      }
    } catch (err) {
      console.error("Error finding ticket in chat:", err);
    }
  }

  // 2. Fetch Active Products Catalog
  const allProducts = await db.getProducts({ includeInactive: false });

  // 3. If AI is available, use the gateway model for deep semantic understanding and product guidance
  if (aiEnabled) {
    try {
      const catalogSummary = allProducts.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        category: p.category,
        brand: p.brand || "",
        badge: p.badge || "",
        short_description: p.short_description || p.description?.substring(0, 120) || "",
        stock: p.stock
      }));

      const conversationContext = history
        .slice(-6)
        .map(h => `${h.sender === "user" ? "Cliente" : "Talos"}: ${h.text}`)
        .join("\n");

      const systemInstruction = `Sos "Talos", el asesor tecnológico experto de Dr Tecno (tienda de tecnología, microelectrónica, herramientas de precisión, insumos, capacitaciones y servicio técnico oficial en Paraná, Entre Ríos, Argentina).

REGLAS ESENCIALES DE ASISTENCIA:
1. FLEXIBILIDAD Y GUÍA INTELIGENTE: Los clientes NO conocen los nombres exactos ni códigos de los productos. Pueden hacer preguntas coloquiales, vagas, descriptivas, con errores de ortografía o basadas en necesidades (por ejemplo: "busco algo para soldar placas", "se me rompió la pantalla del celu", "quiero aprender a reparar desde cero", "un cargador rápido", "pastas térmicas o flux", "algo para medir cortos o voltajes", "herramientas para abrir iphone", "indumentaria para el taller").
2. INTERPRETACIÓN DE INTENCIÓN: Interpreta qué busca o necesita el cliente y selecciona del catálogo de Dr Tecno entre 1 y 3 productos que mejor resuelvan su inquietud.
3. TONO CORDIAL Y PROFESIONAL: Responde en español rioplatense neutro y amigable (ej: "¡Hola!", "¡Claro!", "Te recomiendo..."). Explica brevemente por qué esos productos son ideales, destaca especificaciones importantes (temperatura, precisión, compatibilidad, etc.) y haz preguntas de seguimiento si es necesario para definir.
4. INFORMACIÓN DE LA TIENDA:
   - Pagos: Mercado Pago (todas las tarjetas de crédito y débito), Transferencia bancaria directa (con 10% de descuento automático), efectivo en sucursal.
   - Envíos: Envíos a todo el país por Correo Argentino con seguimiento, o retiro sin cargo en la sucursal.
   - Garantía: 30 días de garantía escrita. Se priorizan repuestos originales (sobre todo en la alta gama) y se usan alternativos de calidad probados en el resto; no todo es original.
   - Sucursal: Gualeguaychú 595, Paraná, Entre Ríos.
   - Servicio técnico: Trazabilidad en tiempo real con código de ticket TEC-XXXXX.
   - Quiz inteligente: Recomendador personalizado en la web (/quiz).
5. CATÁLOGO DISPONIBLE:
${JSON.stringify(catalogSummary, null, 2)}

Devuelve SIEMPRE un JSON válido con la siguiente estructura:
{
  "reply": "Texto de respuesta para el usuario con formato Markdown (**negrita**)",
  "recommendedProductSlugs": ["slug-1", "slug-2"],
  "quickReplies": ["Pregunta sugerida 1", "Pregunta sugerida 2"]
}`;

      const userPrompt = `Historial reciente de la conversación:
${conversationContext || "Ninguno"}

Mensaje actual del cliente:
"${cleanMessage}"

Analiza la consulta y genera la mejor recomendación técnica guiada.`;

      const { object: parsed } = await generateObject({
        model: AI_MODEL,
        schema: z.object({
          reply: z.string(),
          recommendedProductSlugs: z.array(z.string()),
          quickReplies: z.array(z.string())
        }),
        system: systemInstruction,
        prompt: userPrompt
      });

      const recommendedSlugs: string[] = Array.isArray(parsed.recommendedProductSlugs)
        ? parsed.recommendedProductSlugs
        : [];

      // Hydrate recommended products from full database objects
      const hydratedProducts: ProductSummary[] = [];
      for (const slug of recommendedSlugs) {
        const found = allProducts.find(p => p.slug === slug || p.id === slug);
        if (found && !hydratedProducts.some(hp => hp.id === found.id)) {
          hydratedProducts.push({
            id: found.id,
            slug: found.slug,
            name: found.name,
            price: found.price,
            category: found.category,
            image_url: found.image_url,
            badge: found.badge,
            short_description: found.short_description || found.description,
            inStock: (found.stock || 0) > 0
          });
        }
      }

      // If AI didn't find specific slugs but query clearly matches keywords, supplement with fallback
      if (hydratedProducts.length === 0) {
        const fallback = fallbackSemanticSearch(cleanMessage, allProducts);
        if (fallback.matchedProducts.length > 0) {
          hydratedProducts.push(...fallback.matchedProducts.slice(0, 2));
        }
      }

      return {
        reply: parsed.reply || "¡Hola! ¿En qué puedo ayudarte hoy en Dr Tecno? Contame qué estás buscando.",
        recommendedProducts: hydratedProducts.slice(0, 3),
        quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length > 0
          ? parsed.quickReplies.slice(0, 3)
          : ["Ver catálogo", "Consultar envíos", "Servicio Técnico"],
        whatsappUrl: `https://wa.me/543435052020?text=${encodeURIComponent(cleanMessage)}`
      };

    } catch (aiErr) {
      console.error("Gemini Assistant error, executing semantic fallback:", aiErr);
    }
  }

  // 4. Fallback Semantic & Fuzzy Analyzer (when Gemini is not configured or in case of transient API error)
  const fallback = fallbackSemanticSearch(cleanMessage, allProducts);
  return {
    reply: fallback.reply,
    recommendedProducts: fallback.matchedProducts,
    quickReplies: fallback.quickReplies,
    whatsappUrl: `https://wa.me/543435052020?text=${encodeURIComponent(cleanMessage)}`
  };
}
