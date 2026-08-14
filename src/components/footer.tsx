import React from "react";
import { Cpu, Phone, Mail, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { useNavigate } from "./router.js";

export const Footer: React.FC = () => {
  const { navigate } = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto pt-16 pb-8 text-sm text-muted-foreground font-sans">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand identity column */}
        <div className="space-y-4">
          <div 
            onClick={() => handleLinkClick("/")}
            className="flex items-center cursor-pointer select-none py-1"
          >
            <img 
              src="/images/logo.png" 
              alt="Dr Tecno Logo" 
              className="h-14 sm:h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="leading-relaxed text-xs">
            Un universo tecnológico a tu alcance. Especialistas en hardware de alto rendimiento, dispositivos premium y servicio de reparación especializado con garantía de calidad oficial.
          </p>
          <div className="pt-2 text-xs text-foreground font-serif">
            <span>Servicio Técnico Oficial: </span>
            <span className="text-accent hover:underline cursor-pointer" onClick={() => handleLinkClick("/servicio-tecnico")}>
              Solicitar Turno →
            </span>
          </div>
        </div>

        {/* Directory links */}
        <div className="space-y-4">
          <h4 className="font-serif text-foreground font-semibold tracking-wider text-xs uppercase">Explorar Catálogo</h4>
          <ul className="space-y-2.5 text-xs">
            {[
              { name: "Laptops & Computadoras", query: "/catalogo?category=Laptops" },
              { name: "Smartphones Premium", query: "/catalogo?category=Smartphones" },
              { name: "Sistemas de Audio", query: "/catalogo?category=Audio" },
              { name: "Gaming y Consolas", query: "/catalogo?category=Gaming" },
              { name: "Monitores Ultra HD", query: "/catalogo?category=Monitors" },
            ].map((cat) => (
              <li key={cat.name}>
                <button 
                  onClick={() => handleLinkClick(cat.query)}
                  className="hover:text-accent transition-colors flex items-center gap-1 group cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="font-serif text-foreground font-semibold tracking-wider text-xs uppercase">Menú Principal</h4>
          <ul className="space-y-2.5 text-xs">
            {[
              { label: "Página de Inicio", dest: "/" },
              { label: "Catálogo General", dest: "/catalogo" },
              { label: "Servicios y Productos", dest: "/colecciones" },
              { label: "Asistente Inteligente (Quiz)", dest: "/quiz" },
              { label: "Servicio Técnico Oficial", dest: "/servicio-tecnico" },
              { label: "Sobre Nosotros", dest: "/sobre-nosotros" },
              { label: "Contacto y Sucursales", dest: "/contacto" },
            ].map((item) => (
              <li key={item.label}>
                <button 
                  onClick={() => handleLinkClick(item.dest)}
                  className="hover:text-accent transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Store info & contact */}
        <div className="space-y-4">
          <h4 className="font-serif text-foreground font-semibold tracking-wider text-xs uppercase">Contacto & Sucursal</h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Gualeguaychú 595, Paraná, Entre Ríos, Argentina</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-accent shrink-0" />
              <span>+54 343 505-2020</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p>Lun a Vie: 09:00 - 20:00 hs</p>
                <p>Sábados: 09:00 - 13:00 hs</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Domingos y feriados: Cerrado</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* Footer base credit line */}
      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© {currentYear} Dr Tecno. Todos los derechos reservados. Desarrollado con tecnología de punta.</p>
        <div className="flex items-center gap-4 text-muted-foreground/80">
          <span className="font-serif tracking-widest text-[10px]">PAGOS SEGUROS CONTRA ENTREGA</span>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 border border-border/40 rounded text-[9px] bg-background">MERCADO PAGO READY</span>
            <span className="px-1.5 py-0.5 border border-border/40 rounded text-[9px] bg-background">EFECTIVO / TRANSFERENCIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
