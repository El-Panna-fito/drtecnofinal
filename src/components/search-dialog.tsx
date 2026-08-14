import React, { useState, useEffect, useRef } from "react";
import { Search, X, Laptop, ArrowRight } from "lucide-react";
import { useNavigate } from "./router.js";
import { Product } from "../types.js";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { navigate } = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle typing search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.slice(0, 5)); // show top 5 results
        }
      } catch (err) {
        console.error("Error searching products:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div id="search-overlay" className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-md">
      <div 
        id="search-card"
        className="w-full max-w-2xl mt-16 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-down"
      >
        {/* Search header input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-accent animate-pulse-subtle" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar laptops, celulares, audio, gaming..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-foreground font-sans placeholder-muted-foreground text-base py-1"
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search results body */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="font-sans text-sm">Buscando en Dr Tecno...</span>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-8 text-center text-muted-foreground">
              <Laptop className="w-8 h-8 mx-auto mb-2 opacity-30 text-accent" />
              <p className="text-sm font-sans">Escribí para buscar productos, marcas o categorías.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Laptops", "Smartphones", "Audio", "Gaming", "Monitors"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setQuery(cat)}
                    className="px-3 py-1 text-xs bg-muted hover:bg-muted-foreground/20 rounded-full text-foreground transition-all border border-border"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm font-sans">No se encontraron resultados para "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Intentá con otras palabras clave.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-serif uppercase tracking-widest text-accent mb-3">Resultados de Búsqueda</p>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    navigate(`/producto/${product.slug}`);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border/60 cursor-pointer group transition-all"
                >
                  <img
                    src={product.image_url || undefined}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded bg-muted/20 border border-border/40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-serif text-accent block">
                      {product.category}
                    </span>
                    <h4 className="font-sans font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate font-sans">
                      {product.brand} · {product.short_description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-serif font-semibold text-sm text-foreground block">
                      $ {product.price.toLocaleString("es-AR")}
                    </span>
                    <span className="inline-flex items-center text-[10px] text-accent gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
