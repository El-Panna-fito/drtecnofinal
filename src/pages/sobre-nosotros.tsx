import React from "react";
import { Award, ShieldCheck, Heart, Users, CheckCircle2, BookOpen, Wrench, Sparkles, MapPin, Quote, TrendingUp } from "lucide-react";
import { useNavigate } from "../components/router.js";

export const SobreNosotrosPage: React.FC = () => {
  const { navigate } = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 font-sans tech-bg">
      
      {/* Header Banner */}
      <div className="border-b border-border/40 pb-6 text-center max-w-2xl mx-auto space-y-3">
        <span className="text-[10px] font-serif uppercase tracking-widest text-logo-pink font-bold bg-logo-pink/10 px-3 py-1 rounded-full border border-logo-pink/20 inline-block">
          Nuestra Identidad • Paraná, Entre Ríos
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
          Sobre DR.TECNO
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Especialistas en servicio técnico de alta precisión y formación profesional en telefonía móvil e informática.
        </p>
      </div>

      {/* Main Identity & Origin Card */}
      <div className="flex flex-col lg:flex-row bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl items-stretch">
        <div className="w-full lg:w-1/2 min-h-[320px] relative overflow-hidden group">
          <img
            src="/images/banner_capacitaciones.png"
            alt="Instituto de Formación Dr Tecno"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
            <div className="text-white space-y-1">
              <span className="px-2.5 py-1 bg-logo-pink text-black text-[10px] font-serif font-bold uppercase rounded-md tracking-wider">
                Desde 2021
              </span>
              <p className="font-serif font-bold text-lg">Más de 17 Años de Experiencia Técnica</p>
              <p className="text-xs text-gray-200">Paraná, Entre Ríos, Argentina</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-6 sm:p-10 space-y-5 flex flex-col justify-center">
          <div className="space-y-2">
            <span className="text-[10px] text-logo-yellow uppercase font-serif tracking-widest block font-bold">
              ¿Cómo surgió la empresa?
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Evolución y Pasión por la Tecnología
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">DR.TECNO</strong> nació en <strong className="text-foreground">2021</strong> cuando <strong className="text-foreground">Gastón Rodríguez</strong>, propietario de <em>GR Servicio Técnico</em>, adquirió la empresa <em>CB Telefonía</em>, dando inicio a una nueva etapa consolidada bajo la marca DR.TECNO.
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Si bien la marca inició formalmente en 2021, la historia está respaldada por más de <strong className="text-foreground">17 años de trayectoria profesional de Gastón</strong> en el rubro de la tecnología y la reparación. A lo largo de los años, la empresa evolucionó para acompañar las nuevas necesidades del sector, pasando de un taller tradicional a un laboratorio de microelectrónica, un instituto de formación capacitador y un centro distribuidor de insumos.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-3 py-1 bg-muted border border-border rounded-full font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-logo-green" /> Servicio Técnico Especializado
            </span>
            <span className="px-3 py-1 bg-muted border border-border rounded-full font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-logo-pink" /> Instituto de Formación
            </span>
            <span className="px-3 py-1 bg-muted border border-border rounded-full font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-logo-yellow" /> Insumos & Herramientas
            </span>
          </div>
        </div>
      </div>

      {/* Pillars Section */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] text-logo-green uppercase font-serif tracking-widest font-bold block">
            Nuestros Ejes de Trabajo
          </span>
          <h3 className="font-serif text-2xl font-bold text-foreground">Los Pilares de DR.TECNO</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-3.5 shadow-md hover:border-logo-pink/40 transition-colors">
            <div className="p-3 bg-logo-pink/10 border border-logo-pink/20 rounded-lg text-logo-pink w-fit">
              <Wrench className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-foreground">Servicio Técnico Especializado</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Orientado al diagnóstico y reparación de dispositivos de telefonía móvil de alta complejidad. Trabajamos con herramientas de precisión, microscopía y conocimientos especializados en microelectrónica.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-3.5 shadow-md hover:border-logo-green/40 transition-colors">
            <div className="p-3 bg-logo-green/10 border border-logo-green/20 rounded-lg text-logo-green w-fit">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-foreground">Instituto de Formación</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Capacitamos a personas que buscan iniciarse y desarrollarse profesionalmente. Ofrecemos cursos desde niveles iniciales hasta especializaciones avanzadas combinando teoría rigurosa y práctica de laboratorio.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 space-y-3.5 shadow-md hover:border-logo-yellow/40 transition-colors md:col-span-2 lg:col-span-1">
            <div className="p-3 bg-logo-yellow/10 border border-logo-yellow/20 rounded-lg text-logo-yellow w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-foreground">Área Comercial & Complementarios</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Abastecemos a técnicos y talleres con herramientas de precisión, repuestos, insumos y componentes certificados. Además brindamos servicio técnico de PC, soluciones informáticas y armado de equipos a medida.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-muted/40 border border-border/60 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] text-logo-pink uppercase font-serif tracking-widest font-bold block">
            Cultura & Principios
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Valores que nos Acompañan</h3>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { title: "Honestidad", desc: "Diagnósticos transparentes e información clara en todo momento.", icon: ShieldCheck, color: "text-logo-pink bg-logo-pink/10" },
            { title: "Compromiso", desc: "Responsabilidad total con cada cliente, alumno y reparación.", icon: Heart, color: "text-logo-yellow bg-logo-yellow/10" },
            { title: "Trabajo en Equipo", desc: "Sinergia técnica para resolver los casos más desafiantes.", icon: Users, color: "text-logo-green bg-logo-green/10" },
            { title: "Desarrollo", desc: "Promovemos el crecimiento personal y laboral de la comunidad.", icon: TrendingUp, color: "text-logo-cyan bg-logo-cyan/10" },
            { title: "Actualización", desc: "Evolución constante junto a los avances de la tecnología.", icon: Award, color: "text-logo-pink bg-logo-pink/10" },
            { title: "Vocación", desc: "Pasión por reparar, enseñar y transmitir conocimiento.", icon: Sparkles, color: "text-logo-green bg-logo-green/10" },
          ].map((val) => {
            const IconC = val.icon;
            return (
              <div key={val.title} className="bg-card border border-border/40 p-4 rounded-xl space-y-2 text-center flex flex-col items-center">
                <div className={`p-2.5 rounded-lg w-fit ${val.color}`}>
                  <IconC className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-xs text-foreground mt-1">{val.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Differentials & Gastón Rodríguez Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* Differentials Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] text-logo-green uppercase font-serif tracking-widest font-bold block">
              Ventaja Competitiva
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              ¿Qué nos diferencia de la competencia?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nuestro principal diferencial es que nuestro crecimiento está construido desde el <strong className="text-foreground">conocimiento y la experiencia técnica real</strong>.
            </p>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 bg-muted/60 rounded-xl border border-border/40 space-y-1">
              <strong className="text-foreground block text-xs">Conocemos el trabajo técnico desde adentro:</strong>
              <p>Entendemos las necesidades reales de quienes reparan dispositivos día a día y de quienes buscan iniciarse en este rubro.</p>
            </div>
            <div className="p-3 bg-muted/60 rounded-xl border border-border/40 space-y-1">
              <strong className="text-foreground block text-xs">Asesoramiento especializado & Transparencia:</strong>
              <p>Explicamos de manera clara y entendible, brindando soluciones confiables y manteniéndonos en permanente actualización.</p>
            </div>
            <div className="p-3 bg-muted/60 rounded-xl border border-border/40 space-y-1">
              <strong className="text-foreground block text-xs">Espacio de confianza y crecimiento:</strong>
              <p>Buscamos que cada cliente, técnico o alumno encuentre un lugar donde resolver sus inquietudes y proyectar su futuro.</p>
            </div>
          </div>
        </div>

        {/* Founder Quote Card */}
        <div className="bg-gradient-to-br from-card via-muted/50 to-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <Quote className="absolute top-4 right-4 w-20 h-20 text-logo-pink/10 pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] text-logo-pink uppercase font-serif tracking-widest font-bold block">
              Palabras de Gastón Rodríguez (Fundador)
            </span>
            <h4 className="font-serif text-lg font-bold text-foreground italic">
              "Si comenzáramos nuevamente, ¿qué haríamos diferente?"
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed pt-2">
              “Si tuviera que comenzar nuevamente, aprovecharía desde el primer día todo el conocimiento adquirido a través de los años y de los errores cometidos. También tomaría más riesgos, entendiendo que muchas veces equivocarse es parte del proceso de aprendizaje.”
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
              “Hoy entiendo que cada desafío y cada error nos permitió crecer, tomar mejores decisiones y descubrir nuevas posibilidades. Por eso, si volviera al comienzo, buscaría aprender más rápido, animarme antes a tomar decisiones y aprovechar cada oportunidad de crecimiento.”
            </p>
          </div>

          <div className="border-t border-border/40 pt-4 flex items-center justify-between relative z-10">
            <div>
              <p className="font-serif font-bold text-sm text-foreground">Gastón Rodríguez</p>
              <p className="text-[11px] text-logo-pink font-sans font-medium">Fundador & Propietario de DR.TECNO</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Paraná, Entre Ríos</span>
          </div>
        </div>

      </div>

      {/* Projection & Medium Term Goals */}
      <div className="bg-muted p-8 rounded-2xl border border-border/70 text-center max-w-3xl mx-auto space-y-4 shadow-xl">
        <span className="text-[10px] text-logo-cyan uppercase font-serif tracking-widest font-bold block">
          Mirada al Futuro
        </span>
        <h4 className="font-serif text-xl font-bold text-foreground">Nuestra Proyección a Mediano Plazo</h4>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Buscamos seguir consolidando a DR.TECNO como un referente en servicio técnico y formación profesional en telefonía móvil. Queremos seguir profesionalizando procesos, incorporando tecnologías de vanguardia y potenciando el crecimiento humano de nuestro equipo y estudiantes.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate("/contacto")}
            className="px-6 py-3 bg-logo-pink hover:opacity-90 text-black text-xs font-serif font-bold uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer"
          >
            Contacto & Sucursal Paraná
          </button>
          <button
            onClick={() => navigate("/quiz")}
            className="px-6 py-3 bg-card border border-border hover:border-logo-pink text-foreground text-xs font-serif font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            Ver Recomendador de Cursos
          </button>
        </div>
      </div>

    </div>
  );
};

