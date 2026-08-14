import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw, Cpu, Laptop, ShoppingCart, HelpCircle } from "lucide-react";
import { useNavigate } from "../components/router.js";
import { useCart } from "../components/cart/cart-provider.js";
import { Product } from "../types.js";

interface Question {
  id: number;
  text: string;
  options: { label: string; value: string }[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¿Cuál es tu nivel de experiencia previa en reparación de celulares?",
    options: [
      { label: "🌱 Nivel Inicial: Ninguna experiencia previa, quiero aprender desde cero", value: "inicial" },
      { label: "🛠️ Nivel Intermedio: Conozco lo básico, quiero dominar micro-soldadura y lectura de esquemáticos", value: "intermedio" },
      { label: "🔬 Nivel Avanzado: Trabajo en el rubro, busco especializarme en reballing avanzado y fallas complejas de placa lógica", value: "avanzado" },
      { label: "💼 Ninguno: Solo busco adquirir insumos de calidad y herramientas para mi propio laboratorio", value: "tools" }
    ]
  },
  {
    id: 2,
    text: "¿Qué área técnica o tipo de insumo te interesa priorizar hoy?",
    options: [
      { label: "📦 Insumos & Repuestos: Adhesivos, pantallas OLED, estaño y baterías de reemplazo", value: "insumos" },
      { label: "⚙️ Herramientas de Laboratorio: Estaciones de soldado, microscopios y multímetros", value: "herramientas" },
      { label: "📚 Capacitación Profesional: Una formación guiada paso a paso con salida laboral rápida", value: "capacitacion" },
      { label: "👕 Indumentaria & Accesorios: Remeras oficiales, gorras y tazas para técnicos de Dr Tecno", value: "merch" }
    ]
  },
  {
    id: 3,
    text: "¿Cuál es tu presupuesto estimado para invertir en esta etapa?",
    options: [
      { label: "💵 Hasta $ 50.000 (Insumos básicos de taller, adhesivos y accesorios oficiales)", value: "low" },
      { label: "💸 Entre $ 50.000 y $ 200.000 (Herramientas de apertura, soldadura inicial o curso introductorio)", value: "medium" },
      { label: "💎 Más de $ 200.000 (Equipamiento profesional de laboratorio o cursos avanzados presenciales)", value: "high" }
    ]
  },
  {
    id: 4,
    text: "¿Cuál es tu principal meta en el campo de la reparación celular?",
    options: [
      { label: "🚀 Iniciar mi propio negocio o taller de reparaciones independiente", value: "negocio" },
      { label: "👔 Conseguir un empleo calificado en un servicio técnico de primer nivel", value: "empleo" },
      { label: "📈 Expandir el catálogo de mi tienda y vender insumos a mayoristas", value: "reventa" },
      { label: "🔬 Resolver fallas electrónicas complejas que otros talleres descartan", value: "especializacion" }
    ]
  },
  {
    id: 5,
    text: "¿Qué modalidad de capacitación o adquisición preferís?",
    options: [
      { label: "🏫 Híbrida: Clases teóricas online con clases prácticas presenciales semanales", value: "hibrida" },
      { label: "🔬 Presencial Intensiva: 100% práctico en laboratorios equipados individualmente", value: "presencial" },
      { label: "📦 Auto-aprendizaje: Solo quiero insumos y herramientas para capacitarme por mi cuenta", value: "auto" }
    ]
  }
];

interface ScoredProduct {
  product: Product;
  score: number;
  matchPercentage: number;
}

export const QuizPage: React.FC = () => {
  const { navigate } = useNavigate();
  const { addToCart } = useCart();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<ScoredProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Load catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const resp = await fetch("/api/products");
        if (resp.ok) {
          const data = await resp.json();
          setCatalog(data);
        }
      } catch (err) {
        console.error("Failed to load catalog for quiz:", err);
      }
    };
    fetchCatalog();
  }, []);

  const handleSelectOption = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [QUIZ_QUESTIONS[currentStep].id]: value
    }));
    
    // Go next or calculate
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      calculateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setRecommendations([]);
  };

  const calculateRecommendations = () => {
    setLoading(true);
    
    setTimeout(() => {
      const q1 = answers[1]; // Experiencia
      const q2 = answers[2]; // Prioridad
      const q3 = answers[3]; // Presupuesto
      const q4 = answers[4]; // Meta
      const q5 = answers[5]; // Modalidad

      const scored: ScoredProduct[] = catalog.map((product) => {
        let score = 15; // baseline

        const productCategory = product.category.toLowerCase();
        const productSlug = product.slug.toLowerCase();
        const productPrice = product.price;

        // 1. Experiencia -> Capacitación correspondiente o herramientas
        if (q1 === "inicial") {
          if (productSlug === "curso-reparacion-nivel-inicial") score += 20;
          if (productCategory === "herramientas" && productPrice < 100) score += 10; // Herramientas de entrada
        } else if (q1 === "intermedio") {
          if (productSlug === "curso-reparacion-nivel-intermedio") score += 20;
          if (productSlug === "estacion-soldado-sugon-t26") score += 12;
          if (productCategory === "herramientas") score += 8;
        } else if (q1 === "avanzado") {
          if (productSlug === "curso-reparacion-nivel-avanzado") score += 20;
          if (productSlug === "microscopio-triocular-relife-rl-m3t") score += 15;
          if (productSlug === "estano-pasta-mechanic-183c") score += 10;
        } else if (q1 === "tools") {
          if (productCategory === "herramientas" || productCategory === "insumos") score += 15;
          if (productCategory === "capacitaciones") score -= 15; // No capacitaciones si solo quiere insumos
        }

        // 2. Prioridad de área técnica
        if (q2 === "insumos") {
          if (productCategory === "insumos") score += 15;
        } else if (q2 === "herramientas") {
          if (productCategory === "herramientas") score += 15;
        } else if (q2 === "capacitacion") {
          if (productCategory === "capacitaciones") score += 15;
        } else if (q2 === "merch") {
          if (productCategory === "merchandising") score += 18;
        }

        // 3. Presupuesto
        if (q3 === "low") {
          if (productPrice <= 50) score += 15;
          else if (productPrice <= 150) score -= 5;
          else score -= 20;
        } else if (q3 === "medium") {
          if (productPrice > 50 && productPrice <= 200) score += 15;
          else if (productPrice <= 50) score += 5;
          else score -= 15;
        } else if (q3 === "high") {
          if (productPrice > 200) score += 15;
          else if (productPrice > 100) score += 8;
          else score -= 5;
        }

        // 4. Meta profesional
        if (q4 === "negocio" || q4 === "empleo") {
          if (productCategory === "capacitaciones") score += 10;
          if (productCategory === "herramientas") score += 5;
        } else if (q4 === "reventa") {
          if (productCategory === "insumos") score += 12;
        } else if (q4 === "especializacion") {
          if (productSlug === "curso-reparacion-nivel-avanzado" || productSlug === "microscopio-triocular-relife-rl-m3t") score += 15;
        }

        // 5. Modalidad
        if (q5 === "hibrida") {
          if (productSlug === "curso-reparacion-nivel-inicial") score += 10;
        } else if (q5 === "presencial") {
          if (productSlug === "curso-reparacion-nivel-intermedio" || productSlug === "curso-reparacion-nivel-avanzado") score += 10;
        } else if (q5 === "auto") {
          if (productCategory === "herramientas" || productCategory === "insumos") score += 10;
          if (productCategory === "capacitaciones") score -= 10;
        }

        // Map matching percentage (cap it dynamically)
        const matchPercentage = Math.min(99, Math.max(55, Math.round(55 + (score / 60) * 44)));

        return {
          product,
          score,
          matchPercentage
        };
      });

      // Filter and Sort recommendations descending
      const filteredRecommendations = scored
        .filter(rec => rec.product.active && rec.product.stock > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // show top 3 recommendations

      setRecommendations(filteredRecommendations);
      setLoading(false);
      setCurrentStep(QUIZ_QUESTIONS.length); // triggers final screen
    }, 1200);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 font-sans tech-bg">
      
      {/* 1. QUIZ ACTIVE PHASE */}
      {currentStep < QUIZ_QUESTIONS.length && (
        <div id="quiz-card" className="bg-card border border-border/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-serif">
              <span>PREGUNTA {currentStep + 1} DE {QUIZ_QUESTIONS.length}</span>
              <span className="text-accent font-bold">{Math.round(((currentStep + 1) / QUIZ_QUESTIONS.length) * 100)}% COMPLETO</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/30">
              <div 
                className="h-full bg-accent transition-all duration-500 rounded-full"
                style={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2 pt-2">
            <span className="p-1 px-2.5 bg-accent/15 border border-accent/25 text-[10px] text-accent uppercase font-serif font-bold rounded">
              Asistente Dr Tecno
            </span>
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
              {QUIZ_QUESTIONS[currentStep].text}
            </h2>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {QUIZ_QUESTIONS[currentStep].options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelectOption(opt.value)}
                className="text-left p-4 bg-muted/40 hover:bg-accent/10 border border-border/60 hover:border-accent/50 rounded-xl text-xs sm:text-sm text-foreground hover:text-accent font-medium transition-all cursor-pointer flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accent" />
              </button>
            ))}
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-serif cursor-pointer font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ATRÁS</span>
              </button>
            ) : (
              <div />
            )}
            
            <button
              onClick={() => navigate("/catalogo")}
              className="text-muted-foreground hover:text-rose-400 transition-colors font-serif font-bold cursor-pointer"
            >
              SALIR DEL ASISTENTE
            </button>
          </div>

        </div>
      )}

      {/* 2. LOADING MATCH PHASE */}
      {loading && (
        <div className="bg-card border border-border/80 rounded-2xl p-16 text-center space-y-6 shadow-2xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <Cpu className="absolute inset-0 m-auto w-6 h-6 text-accent animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-foreground">Procesando especificaciones...</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Analizando marcas, procesadores, pantallas y límites de presupuesto en el inventario real de Supabase.
            </p>
          </div>
        </div>
      )}

      {/* 3. RECOMMENDATIONS SCREEN */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header block */}
          <div className="text-center space-y-2">
            <div className="p-2.5 bg-accent/15 border border-accent/30 text-accent rounded-full w-fit mx-auto">
              <Sparkles className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Tus Equipos Ideales</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Según tus respuestas, evaluamos nuestro catálogo tecnológico y estos son los 3 dispositivos que mejor se adaptan a tus requisitos.
            </p>
          </div>

          {/* Cards listing */}
          <div className="space-y-6">
            {recommendations.map((rec, idx) => (
              <div
                key={rec.product.id}
                className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl hover:border-accent/40 transition-colors relative"
              >
                {/* Positional Match Percentage Badge */}
                <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-[10px] font-serif uppercase tracking-widest font-bold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{rec.matchPercentage}% de coincidencia</span>
                </div>

                {/* Left product image column */}
                <div className="w-full md:w-1/3 h-52 md:h-auto bg-muted/15 relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-border/45">
                  <img
                    src={rec.product.image_url || undefined}
                    alt={rec.product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-accent/80 text-accent-foreground text-xs font-serif font-bold px-2 py-0.5 rounded">
                    Top {idx + 1}
                  </div>
                </div>

                {/* Right product info column */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] text-accent uppercase font-serif tracking-wider font-bold">
                      {rec.product.category} · {rec.product.brand}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground truncate mt-0.5">
                      {rec.product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-normal mt-1.5">
                      {rec.product.description}
                    </p>

                    {/* Quick key specs indicators */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(rec.product.specifications).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 bg-muted border border-border/30 rounded text-[9px] text-foreground font-sans">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/30">
                    <div className="font-serif">
                      <span className="text-[10px] text-muted-foreground uppercase block">Precio Especial</span>
                      <span className="text-lg font-bold text-foreground">
                        $ {rec.product.price.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/producto/${rec.product.slug}`)}
                        className="px-4 py-2 border border-border hover:border-accent hover:text-accent rounded-lg text-xs font-serif font-bold uppercase transition-all cursor-pointer"
                      >
                        Ficha Técnica
                      </button>

                      <button
                        onClick={() => addToCart(rec.product)}
                        className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-serif font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer hover:bg-accent/90"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-card border border-border/60 rounded-xl shadow">
            <div className="text-center sm:text-left space-y-0.5">
              <h4 className="font-serif text-sm font-bold text-foreground">¿No te convencen los resultados?</h4>
              <p className="text-[11px] text-muted-foreground">Podés volver a responder el quiz o visitar la tienda completa.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-muted border border-border hover:bg-muted-foreground/10 text-xs font-serif font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Quiz</span>
              </button>

              <button
                onClick={() => navigate("/catalogo")}
                className="px-4 py-2.5 bg-accent text-accent-foreground text-xs font-serif font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer hover:bg-accent/90"
              >
                Explorar Catálogo General
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
