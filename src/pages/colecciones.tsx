import React, { useEffect, useState } from "react";
import { Wrench, Package, GraduationCap, Award, ArrowRight } from "lucide-react";
import { useNavigate } from "../components/router.js";
import { Collection } from "../types.js";

const FALLBACK_COLLECTIONS: Collection[] = [
  {
    id: "herramientas",
    name: "Herramientas de Precisión",
    subtitle: "Estaciones, Lupas & Soldadores",
    description: "Equipamiento profesional para laboratorios de microelectrónica. Desde estaciones de soldado de alta precisión hasta microscopios bi/trioculares, stencils, pinzas cerámicas y herramientas para la apertura segura de dispositivos.",
    bg_url: "/images/banner_herramientas.png",
    items_list: ["Estaciones de Soldado & Aire Caliente", "Microscopios de Laboratorio", "Herramientas de Apertura de Precisión", "Multímetros & Fuentes de Alimentación"]
  },
  {
    id: "insumos",
    name: "Insumos & Repuestos",
    subtitle: "Módulos, Baterías & Pegamentos",
    description: "Los mejores insumos para reparaciones exitosas. Contamos con módulos de repuesto certificados (pantallas OLED/LCD), baterías de alta capacidad con ciclo cero, pegamentos UV y B7000/T7000, flux de resina orgánica y aleaciones de estaño en pasta premium.",
    bg_url: "/images/banner_insumos.png",
    items_list: ["Módulos de Pantalla (Original / Premium)", "Baterías de Ciclo Cero", "Flux & Estaño en Pasta", "Adhesivos & Limpiadores de Placa"]
  },
  {
    id: "capacitaciones",
    name: "Capacitaciones Profesionales",
    subtitle: "Cursos Inicial, Intermedio y Avanzado",
    description: "Aprende el oficio con mayor demanda y rentabilidad. Ofrecemos cursos presenciales y online con laboratorios individuales equipados para que te conviertas en un experto, desde cambio de módulos hasta diagnóstico de placas complejas por microelectrónica.",
    bg_url: "/images/banner_capacitaciones.png",
    items_list: ["Curso de Reparación Nivel Inicial", "Curso de Reparación Nivel Intermedio", "Curso de Microelectrónica Avanzado", "Certificaciones Oficiales de Dr Tecno"]
  },
  {
    id: "merchandising",
    name: "Merchandising Dr Tecno",
    subtitle: "Remeras & Accesorios de Taller",
    description: "Lleva tu pasión por la electrónica y el taller con orgullo. Nuestra línea de indumentaria y accesorios oficiales de Dr Tecno está diseñada para técnicos entusiastas: remeras de algodón premium, gorras trucker y tazas de colección.",
    bg_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    items_list: ["Remera Oficial Lab Edition", "Gorra Trucker Dr Tecno", "Taza de Cerámica Integrated Circuit", "Accesorios & Stickers para tu taller"]
  }
];

const getIcon = (id: string) => {
  switch (id.toLowerCase()) {
    case "herramientas":
      return Wrench;
    case "insumos":
      return Package;
    case "capacitaciones":
      return GraduationCap;
    case "merchandising":
      return Award;
    default:
      return Wrench;
  }
};

export const CollectionsPage: React.FC = () => {
  const { navigate } = useNavigate();
  const [collections, setCollections] = useState<Collection[]>(FALLBACK_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            // Merge matching with fallback items list if not present
            const merged = data.map((item: Collection) => {
              const fb = FALLBACK_COLLECTIONS.find(f => f.id === item.id);
              return {
                ...item,
                items_list: item.items_list || fb?.items_list || []
              };
            });
            setCollections(merged);
          }
        }
      } catch (err) {
        console.error("Error fetching collections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 font-sans tech-bg" id="collections-container">
      
      {/* Page Header */}
      <div className="border-b border-border/40 pb-4 text-center max-w-xl mx-auto space-y-2" id="collections-header">
        <span className="text-[10px] font-serif uppercase tracking-widest text-accent font-bold">Líneas de Negocio</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Servicios y Productos</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Explorá nuestras áreas especializadas. Ofrecemos herramientas de nivel profesional, insumos y módulos certificados de primera calidad, las capacitaciones técnicas más completas del mercado y merchandising oficial de taller.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground gap-2">
          <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
          <span>Cargando servicios y productos actualizados...</span>
        </div>
      )}

      {/* Collections layout list */}
      <div className="space-y-12" id="collections-grid">
        {collections.map((col, idx) => {
          const IconC = getIcon(col.id);
          const isEven = idx % 2 === 0;

          return (
            <div
              key={col.id}
              id={`collection-card-${col.id}`}
              className={`flex flex-col lg:flex-row bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-accent/30 group ${
                isEven ? "" : "lg:flex-row-reverse"
              }`}
            >
              {/* Graphic Banner */}
              <div className="relative w-full lg:w-1/2 h-64 lg:h-auto overflow-hidden min-h-[250px]">
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent lg:hidden z-10" />
                <img
                  src={col.bg_url || col.bgUrl || undefined}
                  alt={col.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Floating graphic indicator inside cover */}
                <div className="absolute top-4 left-4 z-20 p-2.5 bg-background/80 border border-border/60 rounded-xl backdrop-blur-md">
                  <IconC className="w-5 h-5 text-accent animate-pulse-subtle" />
                </div>
              </div>

              {/* Text info block */}
              <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-accent uppercase font-serif tracking-wider font-bold block mb-1">
                      {col.subtitle}
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-foreground tracking-tight group-hover:text-accent transition-colors">
                      {col.name}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {col.description}
                  </p>

                  {/* Bullet listings of inside items */}
                  {col.items_list && col.items_list.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-serif uppercase text-foreground tracking-wider font-semibold">
                        ¿Qué podés encontrar?
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {col.items_list.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-1.5 w-1.5 bg-accent rounded-full shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Navigation CTA button */}
                <div className="pt-4 border-t border-border/30">
                  <button
                    onClick={() => navigate(`/catalogo?collection=${col.id}`)}
                    className="px-5 py-2.5 bg-accent text-accent-foreground text-xs font-serif font-bold tracking-widest uppercase rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <span>Explorar Línea</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
