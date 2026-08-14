import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Grid3X3, Trash2, ShoppingCart, Eye, Sparkles } from "lucide-react";
import { useNavigate } from "../components/router.js";
import { useCart } from "../components/cart/cart-provider.js";
import { Product } from "../types.js";

const DEFAULT_CATEGORIES = [
  "Todos",
  "Repuestos",
  "Herramientas",
  "Insumos",
  "Capacitaciones",
  "Merchandising",
  "Gaming",
  "Audio",
  "Smartphones",
  "Laptops"
];

const COLLECTIONS = [
  { id: "all", label: "Todas las Líneas" },
  { id: "repuestos", label: "Repuestos & Componentes" },
  { id: "herramientas", label: "Herramientas de Precisión" },
  { id: "insumos", label: "Insumos & Repuestos" },
  { id: "capacitaciones", label: "Capacitaciones Profesionales" },
  { id: "merchandising", label: "Merchandising Dr Tecno" }
];

export const CatalogPage: React.FC = () => {
  const { navigate } = useNavigate();
  const { addToCart } = useCart();

  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [collection, setCollection] = useState("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("newest");

  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch available categories dynamically from API
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : [])
      .then((cats: string[]) => {
        if (Array.isArray(cats) && cats.length > 0) {
          const merged = Array.from(new Set(["Todos", ...DEFAULT_CATEGORIES.slice(1), ...cats]));
          setCategoriesList(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Parse URL query parameters on mount (e.g. from Home banner clicks)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get("category");
      if (categoryParam) {
        setCategory(categoryParam);
      }
      const collectionParam = params.get("collection");
      if (collectionParam) {
        setCollection(collectionParam);
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearch(searchParam);
      }
    } catch (err) {
      console.error("Error reading URL search params:", err);
    }
  }, []);

  // Fetch filtered products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/products?sort=${sort}`;
        if (category && category !== "Todos") {
          url += `&category=${encodeURIComponent(category)}`;
        }
        if (collection && collection !== "all") {
          url += `&collection=${encodeURIComponent(collection)}`;
        }
        if (search.trim()) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        if (minPrice !== "") {
          url += `&minPrice=${minPrice}`;
        }
        if (maxPrice !== "") {
          url += `&maxPrice=${maxPrice}`;
        }
        if (featuredOnly) {
          url += `&featured=true`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al consultar el catálogo de productos");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || "Error al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounce);
  }, [category, collection, search, minPrice, maxPrice, featuredOnly, sort]);

  const handleClearFilters = () => {
    setSearch("");
    setCategory("Todos");
    setCollection("all");
    setMinPrice("");
    setMaxPrice("");
    setFeaturedOnly(false);
    setSort("newest");
    // Clear browser address bar parameters
    window.history.pushState(null, "", "/catalogo");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 font-sans tech-bg">
      
      {/* Title & Stats */}
      <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-serif uppercase tracking-widest text-accent font-bold">Catálogo Público</span>
          <h1 className="font-serif text-3xl font-bold text-foreground">Explorá la Tecnología</h1>
        </div>
        <p className="text-xs text-muted-foreground font-serif">
          Mostrando <span className="text-accent font-bold">{products.length}</span> productos disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* =============== DESKTOP FILTERS SIDEBAR =============== */}
        <aside className="hidden lg:block bg-card border border-border/60 rounded-xl p-5 space-y-6 h-fit shrink-0">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-accent" />
              <span>Filtros avanzados</span>
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-[10px] uppercase font-serif text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Búsqueda rápida</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, marca, descripción..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Categorías</label>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left text-xs py-1.5 px-2.5 rounded-md transition-all cursor-pointer ${
                    category === cat
                      ? "bg-accent/10 text-accent font-medium border-l-2 border-accent pl-3"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {cat === "Todos" ? "Todas las Categorías" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Collection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Línea de Negocio</label>
            <div className="flex flex-col gap-1">
              {COLLECTIONS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setCollection(col.id)}
                  className={`text-left text-xs py-1.5 px-2.5 rounded-md transition-all cursor-pointer ${
                    collection === col.id
                      ? "bg-accent/10 text-accent font-medium border-l-2 border-accent pl-3"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Boundaries */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Rango de precio ($ ARS)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent font-serif"
              />
              <input
                type="number"
                placeholder="Máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent font-serif"
              />
            </div>
          </div>

          {/* Featured items filter checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="featuredOnly"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="accent-accent h-4 w-4 rounded border-border bg-background"
            />
            <label htmlFor="featuredOnly" className="text-xs text-foreground font-medium select-none cursor-pointer">
              Solo productos destacados
            </label>
          </div>
        </aside>

        {/* =============== PRODUCTS LIST & MOBILE HEADER =============== */}
        <section className="col-span-1 lg:col-span-3 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-4">
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="lg:hidden flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg text-xs font-serif text-foreground hover:bg-muted-foreground/10 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-serif text-muted-foreground ml-auto">
              <span>Ordenar por:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
              </select>
            </div>
          </div>

          {/* =============== MOBILE FILTERS DRAWER =============== */}
          {isMobileFiltersOpen && (
            <div className="lg:hidden bg-card border border-border/80 rounded-xl p-5 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <h4 className="font-serif text-sm font-bold text-foreground">Filtros de búsqueda</h4>
                <button
                  onClick={handleClearFilters}
                  className="text-[10px] text-rose-400 font-serif"
                >
                  Limpiar todo
                </button>
              </div>

              {/* Mobile Search */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Búsqueda rápida</label>
                <input
                  type="text"
                  placeholder="Notebook, cargador, audífonos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-1.5 text-xs text-foreground"
                />
              </div>

              {/* Mobile Category Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Categorías</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-1.5 text-xs text-foreground"
                >
                  {categoriesList.map(c => (
                    <option key={c} value={c}>{c === "Todos" ? "Todas las Categorías" : c}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Collection Select */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Línea de Negocio</label>
                <select
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-1.5 text-xs text-foreground"
                >
                  {COLLECTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Prices */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Límites de precio</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-1/2 bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-serif"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-1/2 bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-serif"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mobileFeatured"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                />
                <label htmlFor="mobileFeatured" className="text-xs">Solo destacados</label>
              </div>
            </div>
          )}

          {/* =============== PRODUCTS FEED =============== */}
          {error && (
            <div className="p-12 text-center bg-rose-950/20 border border-rose-500/30 text-rose-300 rounded-xl font-sans">
              <p className="font-semibold">Ocurrió un error al cargar el catálogo</p>
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-card border border-border/40 rounded-xl p-4 h-80 animate-pulse flex flex-col justify-between">
                  <div className="h-40 bg-muted/40 rounded-lg" />
                  <div className="space-y-2 mt-4">
                    <div className="h-3.5 bg-muted/30 rounded w-1/4" />
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                  </div>
                  <div className="h-8 bg-muted/30 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-border/60 bg-muted/10 rounded-xl space-y-3">
              <Grid3X3 className="w-10 h-10 mx-auto text-border opacity-60" />
              <p className="font-serif font-bold text-base text-foreground">No se encontraron productos</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No hay productos en esta selección que coincidan con los filtros configurados. Intentá modificando los filtros o presionando limpiar.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-serif font-bold hover:bg-accent/90 transition-all cursor-pointer"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card border border-border/50 hover:border-accent/30 rounded-xl p-4 flex flex-col justify-between group transition-all hover:scale-[1.01] shadow-sm hover:shadow-lg relative overflow-hidden"
                >
                  {/* Badge decoration */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-accent/20 border border-accent/40 text-accent text-[9px] font-serif uppercase font-bold rounded">
                      {product.badge}
                    </span>
                  )}

                  {/* Thumbnail */}
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
                      <span className="text-[10px] text-accent uppercase font-serif tracking-wider">{product.category}</span>
                      <h4 
                        onClick={() => navigate(`/producto/${product.slug}`)}
                        className="font-sans font-semibold text-sm text-foreground hover:text-accent cursor-pointer truncate transition-colors"
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                        {product.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-4">
                      <span className="font-serif font-bold text-sm text-foreground">
                        $ {product.price.toLocaleString("es-AR")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {product.stock > 0 ? `${product.stock} disponibles` : "Sin Stock"}
                      </span>
                    </div>
                  </div>

                  {/* Footer links/buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-border/30">
                    <button
                      onClick={() => navigate(`/producto/${product.slug}`)}
                      className="h-8 border border-border hover:border-accent hover:text-accent rounded-lg text-[10px] font-serif uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                    
                    <button
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                      className="h-8 bg-accent disabled:opacity-40 text-accent-foreground text-[10px] font-serif uppercase tracking-wider rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  );
};
