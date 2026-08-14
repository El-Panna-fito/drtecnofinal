import React, { useState } from "react";
import { Menu, X, ShoppingCart, Search, ShieldAlert, Cpu } from "lucide-react";
import { useNavigate } from "./router.js";
import { useCart } from "./cart/cart-provider.js";
import { SearchDialog } from "./search-dialog.js";

export const Navigation: React.FC = () => {
  const { path, navigate } = useNavigate();
  const { cartCount, setCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const links = [
    { label: "Inicio", path: "/" },
    { label: "Catálogo", path: "/catalogo" },
    { label: "Servicios y Productos", path: "/colecciones" },
    { label: "Servicio Técnico", path: "/servicio-tecnico" },
    { label: "Sobre Nosotros", path: "/sobre-nosotros" },
    { label: "Contacto", path: "/contacto" },
  ];

  const handleLinkClick = (destPath: string) => {
    navigate(destPath);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 glass">
        {/* Brand 4-Color Gradient Top Bar */}
        <div className="bg-logo-gradient h-[3px] w-full" />
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo image with custom size and referrer policy */}
          <div 
            onClick={() => handleLinkClick("/")}
            className="flex items-center cursor-pointer select-none py-1"
          >
            <img 
              src="/images/logo.png" 
              alt="Dr Tecno Logo" 
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const isActive = path === link.path || (link.path !== "/" && path.startsWith(link.path));
              return (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(link.path)}
                  className={`font-sans text-sm font-medium transition-colors hover:text-accent relative py-1 cursor-pointer ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-logo-gradient rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Icons and controls */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-muted-foreground hover:text-logo-yellow hover:bg-logo-yellow/10 rounded-lg transition-all cursor-pointer"
              title="Buscar productos"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin Dashboard Panel link */}
            <button
              onClick={() => handleLinkClick("/admin")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                path.startsWith("/admin") 
                  ? "text-logo-pink bg-logo-pink/10" 
                  : "text-muted-foreground hover:text-logo-pink hover:bg-logo-pink/10"
              }`}
              title="Panel Administrativo"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>

            {/* Cart Trigger with items count badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 text-muted-foreground hover:text-logo-green hover:bg-logo-green/10 rounded-lg relative transition-all cursor-pointer"
              title="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-logo-pink text-white text-[10px] font-serif font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse-subtle">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-accent hover:bg-muted/50 rounded-lg transition-all cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 md:hidden bg-background/95 backdrop-blur-lg border-t border-border animate-fade-in">
          <nav className="flex flex-col p-6 space-y-4">
            {links.map((link) => {
              const isActive = path === link.path || (link.path !== "/" && path.startsWith(link.path));
              return (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(link.path)}
                  className={`text-left font-serif text-lg py-2 border-b border-border/40 transition-colors cursor-pointer ${
                    isActive ? "text-accent pl-2 border-l-2 border-l-accent" : "text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Search overlay component */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
