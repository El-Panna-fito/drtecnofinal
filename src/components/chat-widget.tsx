import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Cpu, 
  MessageCircle, 
  ShoppingBag,
  Plus,
  Check,
  AlertTriangle,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useNavigate } from "./router.js";
import { useCart } from "./cart/cart-provider.js";
import { Product } from "../types.js";

export interface ProductCardInfo {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  short_description?: string | null;
  inStock?: boolean;
}

interface Message {
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  whatsappUrl?: string;
  recommendedProducts?: ProductCardInfo[];
  actionUrl?: string;
  actionLabel?: string;
  ticketDetails?: {
    ticket_number?: string;
    request_number?: string;
    customer_name: string;
    customer_dni?: string | null;
    device_type: string;
    brand_model?: string;
    brand?: string | null;
    model?: string | null;
    issue_description?: string;
    problem_description?: string;
    status: string;
    status_notes?: string | null;
    public_notes?: string | null;
  };
  ticketMetadata?: {
    physical_received: boolean;
    received_image?: string;
    repaired_image?: string;
    diagnosis_history?: Array<{
      date: string;
      text: string;
      image?: string;
    }>;
    plain_notes?: string;
  };
}

const DEFAULT_QUICK_REPLIES = [
  "Soldador o estación de soldado",
  "Herramientas para abrir celulares",
  "Pantallas y repuestos",
  "Multímetro para medir voltajes",
  "¿Cómo funciona el envío?",
  "Medios de pago disponibles"
];

const WHATSAPP_BASE = "https://wa.me/543435052020";

export const ChatWidget: React.FC = () => {
  const { navigate } = useNavigate();
  const { addToCart, triggerToast } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "¡Hola! Soy **Talos**, tu asesor técnico en **Dr Tecno** ⚡\n\nPodés preguntarme sobre cualquier producto, necesidad o falla, ¡no hace falta que sepas el nombre exacto! ¿Qué estás buscando o necesitando hoy?",
      timestamp: new Date()
    }
  ]);
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_REPLIES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userText = textToSend.trim();

    // 1. Append user message
    const userMsg: Message = {
      sender: "user",
      text: userText,
      timestamp: new Date()
    };
    
    // Compute updated history for server context
    const currentHistory = messages.slice(-6).map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // 2. Call backend /api/chat with full catalog grounding & Gemini 3.7 Flash
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: currentHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const botMsg: Message = {
        sender: "bot",
        text: data.reply || "¡Hola! ¿En qué puedo ayudarte hoy en Dr Tecno?",
        timestamp: new Date(),
        recommendedProducts: Array.isArray(data.recommendedProducts) ? data.recommendedProducts : [],
        suggestedQuickReplies: data.quickReplies,
        ticketDetails: data.ticketDetails,
        ticketMetadata: data.ticketMetadata,
        whatsappUrl: data.whatsappUrl || `${WHATSAPP_BASE}?text=${encodeURIComponent(userText)}`,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel
      } as any;

      setMessages((prev) => [...prev, botMsg]);

      // Update quick replies if returned from AI
      if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies);
      }
    } catch (err) {
      console.error("Chat request error:", err);
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "¡Hola! Disculpá la demora. Podés consultarnos directamente por nuestro catálogo o escribirnos a nuestro WhatsApp oficial para atención técnica en tiempo real.",
          timestamp: new Date(),
          whatsappUrl: `${WHATSAPP_BASE}?text=${encodeURIComponent(userText)}`
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleAddToCart = (product: ProductCardInfo) => {
    // Construct minimal Product instance for cart
    const cartProduct: Product = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      collection: null,
      brand: null,
      price: product.price,
      short_description: product.short_description || null,
      description: product.short_description || null,
      image_url: product.image_url,
      images: [],
      specifications: {},
      stock: 10,
      featured: false,
      badge: product.badge,
      active: true
    };

    addToCart(cartProduct, 1);
    triggerToast(`¡Agregado al carrito: ${product.name}!`, "success");
    
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  return (
    <div id="chat-widget-wrapper" className="fixed bottom-6 right-6 z-40 font-sans">
      
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 rounded-2xl border border-border/40 shadow-2xl hidden sm:block animate-pulse-subtle">
            <p className="text-xs font-medium text-foreground">¿Buscás un producto o repuesto? ⚡</p>
          </div>
          <button
            id="chat-open-btn"
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full flex items-center justify-center shadow-lg shadow-accent/25 cursor-pointer hover:scale-105 active:scale-95 transition-all relative"
            title="Asistente de Compras & Soporte"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </button>
        </div>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          id="chat-window" 
          className="w-[350px] sm:w-[410px] h-[540px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="bg-muted/80 backdrop-blur px-4 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-accent/15 rounded-xl border border-accent/20">
                <Cpu className="w-4 h-4 text-accent animate-spin" style={{ animationDuration: "10s" }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif text-sm font-semibold text-foreground">Talos</h4>
                  <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded font-mono font-bold">AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium">Asesor Dr Tecno</span>
                </div>
              </div>
            </div>
            <button 
              id="chat-close-btn"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-background/50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-accent text-accent-foreground font-medium rounded-tr-sm"
                      : "bg-muted text-foreground border border-border/80 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {/* Markdown formatted text */}
                  <div className="space-y-1">
                    {msg.text.split("\n").map((line, lineIdx) => {
                      if (!line.trim()) return <div key={lineIdx} className="h-1" />;
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={lineIdx}>
                          {parts.map((part, partIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={partIdx} className="font-bold text-accent">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommended Product Cards List */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2.5">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-accent font-serif">
                        <Sparkles className="w-3 h-3" />
                        <span>Recomendaciones sugeridas:</span>
                      </div>

                      <div className="space-y-2">
                        {msg.recommendedProducts.map((prod) => {
                          const isAdded = !!addedItems[prod.id];
                          return (
                            <div 
                              key={prod.id || prod.slug}
                              className="bg-background/95 border border-border/70 hover:border-accent/40 rounded-xl p-2.5 flex items-center gap-2.5 transition-all shadow-sm"
                            >
                              {/* Product Thumbnail */}
                              <div className="w-12 h-12 rounded-lg bg-black/20 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                                {prod.image_url ? (
                                  <img 
                                    src={prod.image_url} 
                                    alt={prod.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>

                              {/* Info & Price */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[9px] px-1.5 py-0.2 bg-muted text-muted-foreground rounded font-medium truncate">
                                    {prod.category}
                                  </span>
                                  {prod.badge && (
                                    <span className="text-[8.5px] px-1 py-0.2 bg-accent/15 text-accent rounded font-bold truncate">
                                      {prod.badge}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-serif font-bold text-[11px] text-foreground leading-tight truncate" title={prod.name}>
                                  {prod.name}
                                </h5>
                                <p className="text-accent font-extrabold text-[12px] mt-0.5">
                                  $ {prod.price.toLocaleString("es-AR")}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(`/producto/${prod.slug}`);
                                  }}
                                  className="px-2 py-1 bg-muted hover:bg-border/60 text-foreground border border-border text-[10px] font-semibold rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title="Ver detalle del producto"
                                >
                                  <span>Ver</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => handleAddToCart(prod)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isAdded 
                                      ? "bg-emerald-500 text-white" 
                                      : "bg-accent hover:bg-accent/90 text-accent-foreground"
                                  }`}
                                  title="Agregar directamente al carrito"
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Listo</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      <span>Comprar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interactive Service Ticket Status Tracker */}
                  {msg.ticketDetails && (() => {
                    const ticket = msg.ticketDetails;
                    const metadata = msg.ticketMetadata || { physical_received: false, received_image: "", repaired_image: "", diagnosis_history: [] };
                    
                    const getActiveStepIndex = (status: string, physicalReceived: boolean) => {
                      if (status === "recibido") {
                        return physicalReceived ? 1 : 0;
                      }
                      if (status === "en_diagnostico") return 2;
                      if (status === "presupuestado") return 3;
                      if (status === "en_reparacion") return 4;
                      if (status === "listo_para_entregar") return 5;
                      if (status === "entregado") return 6;
                      return 0;
                    };

                    const statusWorkflow = [
                      { id: "pendiente", label: "Turno Registrado (Online)", desc: "Tu turno online se registró con éxito." },
                      { id: "ingresado", label: "Ingresado al Laboratorio", desc: "El equipo fue recibido físicamente en el taller." },
                      { id: "en_diagnostico", label: "En Diagnóstico", desc: "Nuestros ingenieros están diagnosticando las fallas." },
                      { id: "presupuestado", label: "Presupuestado", desc: "Presupuesto generado esperando aprobación." },
                      { id: "en_reparacion", label: "En Reparación", desc: "Reparación de alta precisión en curso." },
                      { id: "listo_para_entregar", label: "Listo para Entregar", desc: "Pruebas superadas. Podés pasar a retirarlo." },
                      { id: "entregado", label: "Entregado", desc: "Dispositivo retirado por el cliente." }
                    ];

                    const activeIdx = getActiveStepIndex(ticket.status, metadata.physical_received);

                    return (
                      <div className="mt-3.5 pt-3 border-t border-border/60 space-y-4">
                        {/* Status Badge & Title */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent font-serif">Trazabilidad de Reparación</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            ticket.status === 'entregado' || ticket.status === 'listo_para_entregar' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-accent/10 text-accent border border-accent/20'
                          }`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Summary details */}
                        <div className="bg-background/80 border border-border/40 rounded-lg p-2.5 space-y-1 text-[10.5px]">
                          <div>
                            <span className="text-muted-foreground font-semibold">Equipo: </span>
                            <span className="text-foreground font-medium">{ticket.brand_model || [ticket.brand, ticket.model].filter(Boolean).join(" ") || ticket.device_type}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold">Cliente: </span>
                            <span className="text-foreground">{ticket.customer_name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold">Problema: </span>
                            <span className="text-foreground italic">"{ticket.problem_description || ticket.issue_description}"</span>
                          </div>
                        </div>

                        {/* Interactive Timeline Stepper */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">Línea de Tiempo:</span>
                          
                          <div className="relative pl-5 space-y-3 border-l border-border/50 ml-1.5">
                            {statusWorkflow.map((step, sIdx) => {
                              const isCompleted = sIdx <= activeIdx;
                              const isActive = sIdx === activeIdx;

                              return (
                                <div key={step.id} className="relative text-[10.5px]">
                                  <span className={`absolute -left-[24.5px] top-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all ${
                                    isActive 
                                      ? "bg-accent border-background text-accent-foreground animate-pulse shadow-md shadow-accent/20" 
                                      : isCompleted 
                                      ? "bg-emerald-500 border-background text-white" 
                                      : "bg-background border-border/60"
                                  }`}>
                                    {isCompleted && <Check className="w-2 h-2 text-white font-black" />}
                                  </span>

                                  <div className="space-y-0.5">
                                    <h5 className={`font-serif font-bold leading-tight ${
                                      isActive ? "text-accent text-[11px]" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                    }`}>
                                      {step.label}
                                    </h5>
                                    <p className="text-[9px] text-muted-foreground leading-normal">{step.desc}</p>
                                    
                                    {/* Received device photo */}
                                    {step.id === "ingresado" && metadata.received_image && isCompleted && (
                                      <div className="mt-2 space-y-1">
                                        <span className="text-[8.5px] text-accent font-mono block font-semibold">Foto de Recepción (Ingreso):</span>
                                        <div className="border border-border/40 rounded-lg overflow-hidden max-w-[200px] bg-black/20">
                                          <img 
                                            src={metadata.received_image || undefined} 
                                            alt="Foto de ingreso" 
                                            className="max-h-24 w-auto object-contain mx-auto"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Repaired device photo */}
                                    {(step.id === "listo_para_entregar" || step.id === "entregado") && metadata.repaired_image && isCompleted && (
                                      <div className="mt-2 space-y-1">
                                        <span className="text-[8.5px] text-accent font-mono block font-semibold">Foto del Equipo Terminado:</span>
                                        <div className="border border-border/40 rounded-lg overflow-hidden max-w-[200px] bg-black/20">
                                          <img 
                                            src={metadata.repaired_image || undefined} 
                                            alt="Foto de equipo terminado" 
                                            className="max-h-24 w-auto object-contain mx-auto"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action required banner */}
                        {!metadata.physical_received && ticket.status === "recibido" && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1 text-[9.5px]">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>SE REQUIERE ENTREGA FÍSICA</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              Por favor, acercá tu equipo a 📍 **Gualeguaychú 595, Paraná** para iniciar la reparación.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Primary Action Button (if specified) */}
                  {msg.actionUrl && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate(msg.actionUrl!);
                      }}
                      className="mt-2.5 w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-serif font-bold uppercase tracking-wider transition-all cursor-pointer text-[10px]"
                    >
                      <span>{msg.actionLabel || "Ver Más"}</span>
                    </button>
                  )}

                  {/* WhatsApp Support Link */}
                  {msg.whatsappUrl && (
                    <a
                      href={msg.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-[11px] transition-colors no-underline cursor-pointer shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Consultar por WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
            
            {/* Bot typing simulation */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-xl px-3 py-2 text-xs flex items-center gap-1.5 border border-border/60">
                  <span className="text-[11px] font-medium text-accent">Talos pensando</span>
                  <span className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Quick Replies Slider */}
          <div className="px-3 py-2 bg-muted/40 border-t border-border flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            {quickReplies.map((replyText, rIdx) => (
              <button
                key={rIdx}
                onClick={() => handleSend(replyText)}
                className="inline-block px-2.5 py-1 bg-card hover:bg-accent/15 hover:text-accent hover:border-accent/30 border border-border text-[10.5px] text-foreground rounded-full transition-all shrink-0 cursor-pointer"
              >
                {replyText}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-muted/80 border-t border-border flex items-center gap-2"
          >
            <input
              id="chat-input-field"
              type="text"
              placeholder="¿Qué necesitás o qué falla tenés?..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-card border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-accent transition-colors"
            />
            <button
              id="chat-submit-btn"
              type="submit"
              disabled={!input.trim() || typing}
              className="p-2 bg-accent hover:bg-accent/90 disabled:bg-muted-foreground/20 disabled:text-muted-foreground text-accent-foreground rounded-xl transition-all cursor-pointer"
              title="Enviar consulta"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
