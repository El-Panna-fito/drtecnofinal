import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, ShieldCheck, Truck, Headphones, RotateCcw, Award, Zap, Laptop, Smartphone, Disc, Gamepad2, Wrench, GraduationCap, Package } from "lucide-react";
import { useNavigate } from "../components/router.js";
import { useCart } from "../components/cart/cart-provider.js";
import { Product } from "../types.js";

interface Slide {
  title: string;
  subtitle: string;
  ctaText: string;
  category: string;
  bgUrl: string;
  badgeColorClass: string;
  btnColorClass: string;
}

const HERO_SLIDES: Slide[] = [
  {
    title: "Herramientas de Precisión",
    subtitle: "Estaciones de soldado, microscopios trioculares y multímetros de nivel profesional para tu laboratorio técnico.",
    ctaText: "Ver Herramientas",
    category: "Herramientas",
    bgUrl: "/images/banner_herramientas.png",
    badgeColorClass: "bg-logo-pink/15 border-logo-pink/30 text-logo-pink",
    btnColorClass: "bg-logo-pink hover:opacity-90 text-black"
  },
  {
    title: "Insumos & Repuestos OEM",
    subtitle: "Módulos de pantalla OLED, baterías premium de 0 ciclos y pegamentos B-7000 de alta adherencia para tus reparaciones.",
    ctaText: "Explorar Insumos",
    category: "Insumos",
    bgUrl: "/images/banner_insumos.png",
    badgeColorClass: "bg-logo-yellow/15 border-logo-yellow/30 text-logo-yellow",
    btnColorClass: "bg-logo-yellow hover:opacity-90 text-black"
  },
  {
    title: "Formación Profesional Completa",
    subtitle: "Capacitaciones en reparación de celulares de nivel Inicial, Intermedio y Avanzado con salida laboral inmediata.",
    ctaText: "Ver Capacitaciones",
    category: "Capacitaciones",
    bgUrl: "/images/banner_capacitaciones.png",
    badgeColorClass: "bg-logo-green/15 border-logo-green/30 text-logo-green",
    btnColorClass: "bg-logo-green hover:opacity-90 text-black"
  }
];

export const HomePage: React.FC = () => {
  const { navigate } = useNavigate();
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto Hero transitions every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch featured products from public API
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const response = await fetch("/api/products?featured=true");
        if (response.ok) {
          const data = await response.json();
          setFeaturedProducts(data.slice(0, 4)); // Show top 4
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="space-y-16 pb-16 tech-bg">
      
      {/* 1. HERO SLIDER */}
      <section id="hero-slider" className="relative h-[420px] sm:h-[550px] w-full overflow-hidden bg-black border-b border-border/40 select-none">
        {/* Slides list */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Light gradient overlay on left for text legibility while keeping background image bright & visible */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10 z-10" />
            <img
              src={slide.bgUrl || undefined}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover scale-105 opacity-95"
            />
            
            {/* Slide contents */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="container mx-auto px-4 max-w-4xl space-y-5">
                <h1 className="font-serif font-bold text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                  {slide.title}
                </h1>
                <p className="font-sans text-sm sm:text-lg text-gray-100 max-w-xl leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {slide.subtitle}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(`/catalogo?category=${slide.category}`)}
                    className={`px-6 py-3 rounded-lg font-serif font-bold text-sm transition-all flex items-center gap-2 cursor-pointer group ${slide.btnColorClass}`}
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-serif uppercase tracking-widest backdrop-blur-md bg-black/40 border ${slide.badgeColorClass}`}>
                    <Sparkles className="w-3.5 h-3.5 animate-pulse-subtle" />
                    <span>Edición Limitada</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation arrows */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 border border-border/40 bg-background/50 hover:bg-background text-foreground hover:text-logo-cyan rounded-full transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 border border-border/40 bg-background/50 hover:bg-background text-foreground hover:text-logo-pink rounded-full transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Inferior indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentSlide 
                  ? idx === 0 ? "w-8 bg-logo-pink" : idx === 1 ? "w-8 bg-logo-yellow" : "w-8 bg-logo-green"
                  : "w-2 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. REPAIR & TRAINING ADVISOR QUIZ CTA */}
      <section className="container mx-auto px-4">
        <div 
          id="quiz-banner" 
          className="relative bg-gradient-to-r from-card to-muted border border-border/80 rounded-2xl p-8 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl"
        >
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <span className="px-2.5 py-1 bg-logo-pink/15 border border-logo-pink/25 rounded-md text-[10px] uppercase font-serif tracking-widest text-logo-pink font-semibold">
              Recomendador Técnico de Dr Tecno
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              ¿Querés capacitarte o equipar tu laboratorio técnico?
            </h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">
              Respondé 5 preguntas rápidas sobre tu nivel de experiencia en reparación de celulares, tus metas comerciales y tu presupuesto disponible. Nuestro recomendador seleccionará de inmediato la capacitación óptima, las herramientas de precisión y los insumos adecuados para vos.
            </p>
          </div>
          <button
            onClick={() => navigate("/quiz")}
            className="px-6 py-4 bg-logo-pink hover:opacity-90 text-black rounded-lg font-serif font-bold text-sm tracking-wider transition-all shadow-lg shrink-0 flex items-center gap-2.5 group cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current animate-pulse-subtle" />
            <span>Iniciar Recomendador Técnico</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/30 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-serif uppercase tracking-widest text-logo-yellow font-bold">Selección Premium</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Productos Destacados</h3>
          </div>
          <button 
            onClick={() => navigate("/catalogo")}
            className="text-xs font-serif font-bold text-logo-pink hover:text-logo-pink/80 hover:underline flex items-center gap-1 group cursor-pointer shrink-0"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-card border border-border/40 rounded-xl p-4 h-80 animate-pulse flex flex-col justify-between">
                <div className="h-40 bg-muted/45 rounded-lg" />
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-muted/40 rounded w-1/4" />
                  <div className="h-4 bg-muted/40 rounded w-3/4" />
                </div>
                <div className="h-8 bg-muted/40 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => {
              // Get category-based brand colors dynamically
              const getCategoryColors = (cat: string) => {
                switch (cat) {
                  case "Herramientas":
                    return {
                      text: "text-logo-pink",
                      hoverText: "hover:text-logo-pink",
                      badge: "bg-logo-pink/20 border-logo-pink/40 text-logo-pink",
                      hoverBorder: "hover:border-logo-pink/40",
                      btnHover: "hover:bg-logo-pink hover:text-black hover:border-transparent"
                    };
                  case "Insumos":
                    return {
                      text: "text-logo-yellow",
                      hoverText: "hover:text-logo-yellow",
                      badge: "bg-logo-yellow/20 border-logo-yellow/40 text-logo-yellow",
                      hoverBorder: "hover:border-logo-yellow/40",
                      btnHover: "hover:bg-logo-yellow hover:text-black hover:border-transparent"
                    };
                  case "Capacitaciones":
                    return {
                      text: "text-logo-green",
                      hoverText: "hover:text-logo-green",
                      badge: "bg-logo-green/20 border-logo-green/40 text-logo-green",
                      hoverBorder: "hover:border-logo-green/40",
                      btnHover: "hover:bg-logo-green hover:text-black hover:border-transparent"
                    };
                  default:
                    return {
                      text: "text-logo-cyan",
                      hoverText: "hover:text-logo-cyan",
                      badge: "bg-logo-cyan/20 border-logo-cyan/40 text-logo-cyan",
                      hoverBorder: "hover:border-logo-cyan/40",
                      btnHover: "hover:bg-logo-cyan hover:text-black hover:border-transparent"
                    };
                }
              };
              const colors = getCategoryColors(product.category);

              return (
                <div
                  key={product.id}
                  className={`bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl relative overflow-hidden ${colors.hoverBorder}`}
                >
                  {/* Badge decoration */}
                  {product.badge && (
                    <span className={`absolute top-3 left-3 z-10 px-2 py-0.5 text-[9px] font-serif uppercase font-bold rounded ${colors.badge}`}>
                      {product.badge}
                    </span>
                  )}
                  
                  {/* Image */}
                  <div 
                    onClick={() => navigate(`/producto/${product.slug}`)}
                    className="h-40 w-full overflow-hidden rounded-lg bg-muted/10 border border-border/30 mb-4 cursor-pointer relative"
                  >
                    <img
                      src={product.image_url || undefined}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className={`text-[10px] uppercase font-serif tracking-wider ${colors.text}`}>{product.category}</span>
                      <h4 
                        onClick={() => navigate(`/producto/${product.slug}`)}
                        className={`font-sans font-medium text-sm text-foreground cursor-pointer truncate transition-colors ${colors.hoverText}`}
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                        {product.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-4">
                      <span className="font-serif font-bold text-base text-foreground">
                        $ {product.price.toLocaleString("es-AR")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {product.stock > 0 ? `Stock: ${product.stock}` : "Sin Stock"}
                      </span>
                    </div>
                  </div>

                  {/* Add rapid to cart button */}
                  <button
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                    className={`mt-4 w-full h-9 bg-muted text-foreground disabled:opacity-40 border border-border text-xs font-serif font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${colors.btnHover}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Añadir al Carrito</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. FEATURED COLLECTIONS */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="border-b border-border/30 pb-4">
          <span className="text-[10px] font-serif uppercase tracking-widest text-logo-pink font-bold">Líneas de Negocio</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Categorías Principales</h3>
        </div>

        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Herramientas de Precisión", value: "Herramientas", icon: Wrench, count: "Estaciones, Lupas & Soldadores", bg: "/images/banner_herramientas.png", textClass: "group-hover:text-logo-pink", iconClass: "text-logo-pink", bgClass: "bg-logo-pink/10 border-logo-pink/25", borderClass: "border-border/40 hover:border-logo-pink/60" },
            { name: "Insumos & Repuestos", value: "Insumos", icon: Package, count: "Módulos, Baterías & Pegamentos", bg: "/images/banner_insumos.png", textClass: "group-hover:text-logo-yellow", iconClass: "text-logo-yellow", bgClass: "bg-logo-yellow/10 border-logo-yellow/25", borderClass: "border-border/40 hover:border-logo-yellow/60" },
            { name: "Capacitaciones", value: "Capacitaciones", icon: GraduationCap, count: "Cursos Inicial, Intermedio y Avanzado", bg: "/images/banner_capacitaciones.png", textClass: "group-hover:text-logo-green", iconClass: "text-logo-green", bgClass: "bg-logo-green/10 border-logo-green/25", borderClass: "border-border/40 hover:border-logo-green/60" },
            { name: "Merchandising Dr Tecno", value: "Merchandising", icon: Award, count: "Remeras & Accesorios de Taller", bg: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=60", textClass: "group-hover:text-logo-cyan", iconClass: "text-logo-cyan", bgClass: "bg-logo-cyan/10 border-logo-cyan/25", borderClass: "border-border/40 hover:border-logo-cyan/60" },
          ].map((col) => {
            const IconComponent = col.icon;
            return (
              <div
                key={col.name}
                onClick={() => navigate(`/catalogo?category=${col.value}`)}
                className={`relative h-44 rounded-xl overflow-hidden border cursor-pointer group shadow-md transition-colors ${col.borderClass}`}
              >
                {/* Background image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-colors z-10" />
                <img
                  src={col.bg || undefined}
                  alt={col.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />

                {/* Contents overlay */}
                <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
                  <div className={`p-2 border rounded-lg w-fit backdrop-blur-xs ${col.bgClass}`}>
                    <IconComponent className={`w-5 h-5 animate-pulse-subtle ${col.iconClass}`} />
                  </div>
                  <div>
                    <h4 className={`font-serif font-bold text-sm text-white drop-shadow-md transition-colors ${col.textClass}`}>
                      {col.name}
                    </h4>
                    <p className="text-[10px] text-gray-200 font-sans mt-0.5 drop-shadow-sm">{col.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="text-center border-b border-border/30 pb-6 max-w-xl mx-auto">
          <span className="text-[10px] font-serif uppercase tracking-widest text-logo-green font-bold">Por Qué Elegirnos</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Garantía Dr Tecno</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Recomendaciones Inteligentes", text: "Olvidate de las especificaciones complejas. El Asistente de Recomendaciones te guía de inmediato al producto ideal según tus requisitos.", icon: Zap },
            { title: "Productos Actualizados", text: "Solo comercializamos hardware original de última generación. Todo nuestro catálogo cuenta con el sello oficial de fábrica.", icon: Award },
            { title: "Envío Express", text: "Envíos veloces y protegidos en menos de 24 horas hábiles a CABA y GBA, y despacho rápido a todo el interior del país.", icon: Truck },
            { title: "Garantía Oficial", text: "Seguridad ante todo. Tu compra cuenta con cobertura legal y garantía escrita certificada por 12 meses directamente con nosotros.", icon: ShieldCheck },
            { title: "Soporte Técnico Especializado", text: "Servicio de mantenimiento, cambio de módulos y optimización de dispositivos con laboratorio propio de alta tecnología.", icon: Headphones },
            { title: "Devolución Fácil", text: "Queremos que quedes 100% satisfecho. Si tu compra experimenta fallas dentro de los primeros 10 días, realizamos el cambio directo.", icon: RotateCcw },
          ].map((benefit, index) => {
            const IconC = benefit.icon;
            // Alternating brand colors for benefit icons
            const iconColorClasses = [
              "text-logo-pink bg-logo-pink/10 border-logo-pink/20",
              "text-logo-yellow bg-logo-yellow/10 border-logo-yellow/20",
              "text-logo-green bg-logo-green/10 border-logo-green/20",
              "text-logo-cyan bg-logo-cyan/10 border-logo-cyan/20",
              "text-logo-pink bg-logo-pink/10 border-logo-pink/20",
              "text-logo-green bg-logo-green/10 border-logo-green/20"
            ];
            const activeColorClass = iconColorClasses[index % iconColorClasses.length];

            return (
              <div 
                key={benefit.title} 
                className="bg-card/40 border border-border/40 rounded-xl p-5 hover:border-border transition-colors flex gap-4"
              >
                <div className={`p-3 rounded-xl border shrink-0 h-fit ${activeColorClass}`}>
                  <IconC className="w-5 h-5 animate-pulse-subtle" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-sans font-semibold text-sm text-foreground">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{benefit.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
