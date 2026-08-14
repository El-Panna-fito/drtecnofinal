import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, LayoutDashboard, ShoppingBag, Truck, Users, 
  Settings, LogOut, Search, Plus, Edit, Trash2, Check, X, 
  SlidersHorizontal, RefreshCw, Landmark, Cpu, Hammer, Heart, Eye, EyeOff, Layers, CreditCard, Database, KeyRound 
} from "lucide-react";
import { Product, Order, Customer, ServiceRequest, Collection } from "../types.js";
import { LocalLogoTransition } from "../components/logo-transition.js";
import { ImageUploadSelector } from "../components/image-upload-selector.js";

interface ServiceRequestMetadata {
  physical_received: boolean;
  received_image?: string;
  repaired_image?: string;
  diagnosis_history?: Array<{
    date: string;
    text: string;
    image?: string;
  }>;
  plain_notes?: string;
}

function parseServiceMetadata(internalNotes: string | null | undefined): ServiceRequestMetadata {
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
    } catch (e) {
      // treat as plain text
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

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingServiceRequests: number;
  inProgressServiceRequests: number;
  recentOrders: any[];
  recentServiceRequests: any[];
}

export const AdminDashboardPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Admin tabs state
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "customers" | "support" | "collections" | "mercadopago">("overview");

  // MercadoPago settings state
  const [mpConfig, setMpConfig] = useState<{
    publicKey: string;
    sandbox: boolean;
    configured: boolean;
    tokenSource?: string;
    webhookConfigured?: boolean;
    updated_at?: string;
  }>({ publicKey: "", sandbox: false, configured: false });
  const [mpSaving, setMpSaving] = useState(false);
  const [mpMessage, setMpMessage] = useState({ text: "", type: "" });

  // Admin lists data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // Editing states
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isNewCollection, setIsNewCollection] = useState(false);

  // Search/Filter states inside tabs
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");

  // Loader states
  const [loadingData, setLoadingData] = useState(false);

  // Edit/Create Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Technical Support management states
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
  const [newLogText, setNewLogText] = useState("");
  const [newLogImage, setNewLogImage] = useState("");

  // Specifications builder helper
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  // Helper to make authenticated requests to the admin API using HttpOnly cookies
  const fetchWithAuth = async (url: string, init?: RequestInit) => {
    return fetch(url, { ...init, credentials: "include" });
  };

  // Helper to safely parse JSON responses
  const parseResponseJson = async (resp: Response) => {
    if (!resp.ok) {
      if (resp.status === 401) {
        setIsAdmin(false);
        throw new Error("Sesión expirada");
      }
      const errData = await resp.json().catch(() => null);
      const errMsg = errData?.error?.message || errData?.error || `Error HTTP ${resp.status}`;
      throw new Error(errMsg);
    }
    const contentType = resp.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Respuesta no válida del servidor");
    }
    return await resp.json();
  };

  // Check existing session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetchWithAuth("/api/admin/session");
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data?.success) {
            setIsAdmin(true);
            setUsername(data.username || "Administrador");
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    verifySession();
  }, []);

  // Fetch admin data once authenticated or on activeTab change
  useEffect(() => {
    if (!isAdmin) return;

    const loadAdminData = async () => {
      setLoadingData(true);
      try {
        if (activeTab === "overview") {
          const resp = await fetchWithAuth("/api/admin/stats");
          setStats(await parseResponseJson(resp));
        } else if (activeTab === "products") {
          const resp = await fetchWithAuth("/api/admin/products");
          setProducts(await parseResponseJson(resp));
        } else if (activeTab === "orders") {
          const resp = await fetchWithAuth("/api/admin/orders");
          setOrders(await parseResponseJson(resp));
        } else if (activeTab === "customers") {
          const resp = await fetchWithAuth("/api/admin/customers");
          setCustomers(await parseResponseJson(resp));
        } else if (activeTab === "support") {
          const resp = await fetchWithAuth("/api/admin/service-requests");
          setServiceRequests(await parseResponseJson(resp));
        } else if (activeTab === "collections") {
          const resp = await fetchWithAuth("/api/admin/collections");
          setCollections(await parseResponseJson(resp));
        } else if (activeTab === "mercadopago") {
          const resp = await fetchWithAuth("/api/admin/mercadopago/config");
          const data = await parseResponseJson(resp);
          setMpConfig({
            publicKey: data.publicKey || "",
            sandbox: !!data.sandbox,
            configured: !!data.configured,
            tokenSource: data.tokenSource,
            webhookConfigured: !!data.webhookConfigured,
            updated_at: data.updated_at
          });
        }
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadAdminData();
  }, [isAdmin, activeTab]);

  const handleSaveMpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMpSaving(true);
    setMpMessage({ text: "", type: "" });
    try {
      const resp = await fetchWithAuth("/api/admin/mercadopago/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          publicKey: mpConfig.publicKey,
          sandbox: mpConfig.sandbox
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setMpMessage({ text: data.message || "Configuración guardada y sincronizada correctamente", type: "success" });
        setMpConfig(prev => ({
          ...prev,
          publicKey: data.publicKey ?? prev.publicKey,
          sandbox: data.sandbox ?? prev.sandbox,
          configured: !!data.configured,
          tokenSource: data.tokenSource ?? prev.tokenSource,
          updated_at: data.updated_at
        }));
      } else {
        setMpMessage({ text: data.error || "Error al guardar la configuración", type: "error" });
      }
    } catch (err: any) {
      setMpMessage({ text: "Error al guardar la configuración: " + err.message, type: "error" });
    } finally {
      setMpSaving(false);
    }
  };

  // Handle Admin Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setIsAdmin(true);
        setUsername(data.username || username);
        setPassword("");
      } else {
        const msg = data?.error?.message || data?.error || "Credenciales incorrectas";
        setLoginError(msg);
      }
    } catch (err: any) {
      setLoginError("Error de conexión al servidor");
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetchWithAuth("/api/admin/logout", { method: "POST" });
      setIsAdmin(false);
      setUsername("");
    } catch (err) {
      setIsAdmin(false);
      setUsername("");
    }
  };

  // Handle order status modifications
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        // Refresh orders list
        const resp = await fetchWithAuth("/api/admin/orders");
        if (resp.ok) setOrders(await resp.json());
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  // Handle service request updates
  const handleUpdateServiceRequest = async (id: string, payload: Partial<ServiceRequest>) => {
    try {
      const response = await fetchWithAuth(`/api/admin/service-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const resp = await fetchWithAuth("/api/admin/service-requests");
        if (resp.ok) {
          const list: ServiceRequest[] = await resp.json();
          setServiceRequests(list);
          if (selectedServiceRequest && selectedServiceRequest.id === id) {
            const updated = list.find(r => r.id === id);
            if (updated) setSelectedServiceRequest(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to update service request:", err);
    }
  };

  const handleSaveServiceMetadata = async (
    updatedMetadata: Partial<ServiceRequestMetadata>,
    newStatus?: string
  ) => {
    if (!selectedServiceRequest) return;
    const currentMetadata = parseServiceMetadata(selectedServiceRequest.internal_notes);
    const finalMetadata: ServiceRequestMetadata = {
      physical_received: updatedMetadata.physical_received !== undefined ? updatedMetadata.physical_received : currentMetadata.physical_received,
      received_image: updatedMetadata.received_image !== undefined ? updatedMetadata.received_image : currentMetadata.received_image,
      repaired_image: updatedMetadata.repaired_image !== undefined ? updatedMetadata.repaired_image : currentMetadata.repaired_image,
      diagnosis_history: updatedMetadata.diagnosis_history !== undefined ? updatedMetadata.diagnosis_history : currentMetadata.diagnosis_history,
      plain_notes: updatedMetadata.plain_notes !== undefined ? updatedMetadata.plain_notes : currentMetadata.plain_notes
    };

    const payload: Partial<ServiceRequest> = {
      internal_notes: JSON.stringify(finalMetadata)
    };
    if (newStatus) {
      payload.status = newStatus as any;
    }

    await handleUpdateServiceRequest(selectedServiceRequest.id, payload);
  };

  // Delete product action
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar permanentemente este producto del catálogo?")) return;
    try {
      const response = await fetchWithAuth(`/api/admin/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // Open product modal for creation
  const handleNewProductClick = () => {
    setEditingProduct({
      name: "",
      slug: "",
      category: "Herramientas",
      collection: "herramientas",
      brand: "",
      price: 0,
      stock: 5,
      short_description: "",
      description: "",
      image_url: "",
      specifications: {},
      badge: "",
      featured: false,
      active: true
    });
    setIsProductModalOpen(true);
  };

  // Open product modal for edit
  const handleEditProductClick = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  // Handle product creation or update submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.slug) {
      alert("Completá los campos requeridos.");
      return;
    }

    const isEdit = !!editingProduct.id;
    const url = isEdit ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct)
      });

      if (response.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        // Refresh products
        const resp = await fetchWithAuth("/api/admin/products");
        if (resp.ok) setProducts(await resp.json());
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Ocurrió un error al guardar el producto: ${errData.details || errData.error || "Error desconocido"}`);
      }
    } catch (err: any) {
      console.error("Failed to save product:", err);
      alert(`Error de conexión al guardar el producto: ${err.message || String(err)}`);
    }
  };

  const handleSaveCollection = async () => {
    if (!editingCollection) return;
    try {
      const url = isNewCollection 
        ? "/api/admin/collections" 
        : `/api/admin/collections/${editingCollection.id}`;
      const method = isNewCollection ? "POST" : "PUT";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCollection)
      });
      if (response.ok) {
        const saved = await response.json();
        if (isNewCollection) {
          setCollections(prev => [...prev, saved]);
        } else {
          setCollections(prev => prev.map(c => c.id === saved.id ? saved : c));
        }
        setIsCollectionModalOpen(false);
        setEditingCollection(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Ocurrió un error al guardar la colección: ${errData.error || "Error desconocido"}`);
      }
    } catch (err: any) {
      console.error("Failed to save collection:", err);
      alert("Error de conexión al guardar la colección.");
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar esta línea de negocio? Esta acción no se puede deshacer y desvinculará los productos que pertenezcan a ella.")) return;
    try {
      const response = await fetchWithAuth(`/api/admin/collections/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setCollections(prev => prev.filter(c => c.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Ocurrió un error al eliminar la colección: ${errData.error || "Error desconocido"}`);
      }
    } catch (err: any) {
      console.error("Failed to delete collection:", err);
      alert("Error de conexión al eliminar la colección.");
    }
  };

  const handleAddSpecification = () => {
    if (!specKey.trim() || !specValue.trim() || !editingProduct) return;
    const updatedSpecs = {
      ...(editingProduct.specifications || {}),
      [specKey.trim()]: specValue.trim()
    };
    setEditingProduct(prev => prev ? { ...prev, specifications: updatedSpecs } : null);
    setSpecKey("");
    setSpecValue("");
  };

  const handleRemoveSpecification = (key: string) => {
    if (!editingProduct || !editingProduct.specifications) return;
    const updatedSpecs = { ...editingProduct.specifications };
    delete updatedSpecs[key];
    setEditingProduct(prev => prev ? { ...prev, specifications: updatedSpecs } : null);
  };

  // Rendering loading state for login verification
  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4 font-sans tech-bg">
        <div className="h-10 w-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Verificando nivel de acceso administrativo...</p>
      </div>
    );
  }

  // ==================== ADMINISTRATIVE LOGIN FORM SCREEN ====================
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center font-sans tech-bg min-h-[500px]">
        <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="p-3 bg-accent/15 border border-accent/25 text-accent rounded-full w-fit mx-auto">
              <ShieldAlert className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Acceso Administrador</h1>
            <p className="text-xs text-muted-foreground">Logueate con tu cuenta autorizada para gestionar inventario, ventas y tickets técnicos.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-foreground font-semibold">Usuario de Red</label>
              <input
                type="text"
                required
                placeholder="Ej: admin_dr_tecno"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none focus:border-accent font-serif"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-semibold">Contraseña Segura</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 text-foreground outline-none focus:border-accent"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-rose-300 leading-normal text-[11px]">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-serif font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter products inside products manager
  const filteredProductsList = products.filter((prod) => {
    const matchesSearch = (prod.name || "").toLowerCase().includes(productSearch.toLowerCase()) || 
                          (prod.brand || "").toLowerCase().includes(productSearch.toLowerCase()) ||
                          (prod.category || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCatFilter === "all" || prod.category === productCatFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter orders inside orders manager
  const filteredOrdersList = orders.filter((ord) => 
    (ord.order_number || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
    (ord.customer_name || "").toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Filter service requests inside technical support manager
  const filteredServiceRequests = serviceRequests.filter((req) => 
    (req.request_number || "").toLowerCase().includes(ticketSearch.toLowerCase()) ||
    (req.customer_name || "").toLowerCase().includes(ticketSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 font-sans tech-bg flex flex-col lg:flex-row gap-8 items-start">
      
      {/* ==================== ADMIN NAVIGATION SIDEBAR ==================== */}
      <aside className="w-full lg:w-64 bg-card border border-border/60 rounded-xl p-4 space-y-4 shrink-0">
        <div className="border-b border-border/30 pb-3 flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-2">
          <div className="flex items-center lg:items-start gap-2 lg:flex-col">
            <img 
              src="/images/logo.png" 
              alt="Dr Tecno Logo" 
              className="h-10 sm:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[10px] text-accent font-mono block">Control Panel ({username})</span>
            </div>
          </div>
          {/* Logout button displayed on mobile inside header, hidden on desktop */}
          <button
            onClick={handleLogout}
            className="flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/25 text-rose-400 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>

        <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 text-xs scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
          {[
            { id: "overview", label: "Panel de Control", icon: LayoutDashboard },
            { id: "products", label: "Gestionar Productos", icon: ShoppingBag },
            { id: "collections", label: "Líneas de Negocio", icon: Layers },
            { id: "orders", label: "Gestionar Pedidos", icon: Truck },
            { id: "customers", label: "Gestionar Clientes", icon: Users },
            { id: "support", label: "Servicio Técnico", icon: Hammer },
            { id: "mercadopago", label: "Mercado Pago", icon: CreditCard },
          ].map((tab) => {
            const IconC = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-lg text-left transition-all cursor-pointer shrink-0 ${
                  isActive 
                    ? "bg-accent/10 text-accent font-medium border-b-2 lg:border-b-0 lg:border-l-2 border-accent px-3" 
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <IconC className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block border-t border-border/30 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-left text-xs font-semibold cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ==================== ADMIN TAB PANELS CONTENT ==================== */}
      <main className="flex-1 w-full bg-card/20 border border-border/45 rounded-xl p-5 sm:p-6 min-h-[500px] relative overflow-hidden">
        <LocalLogoTransition triggerKey={activeTab} />
        {loadingData && (
          <div className="flex items-center justify-center h-48 text-xs text-muted-foreground gap-2">
            <div className="w-4 h-4 border border-accent border-t-transparent rounded-full animate-spin" />
            <span>Sincronizando información de Supabase...</span>
          </div>
        )}

        {!loadingData && (
          <>
            {/* ==================== PANEL 1: OVERVIEW STATISTICS ==================== */}
            {activeTab === "overview" && stats && (
              <div className="space-y-8 animate-fade-in text-xs">
                <div className="border-b border-border/30 pb-3">
                  <h2 className="font-serif text-lg font-bold text-foreground">Estadísticas Comerciales</h2>
                </div>

                {/* Grid counters */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-card border border-border/45 p-4 rounded-xl space-y-1 shadow">
                    <span className="text-muted-foreground font-serif text-[10px] uppercase tracking-widest">Ingresos Totales</span>
                    <p className="font-serif font-bold text-lg sm:text-2xl text-accent">
                      $ {stats.totalRevenue.toLocaleString("es-AR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Facturado contra entrega o acreditado.</p>
                  </div>

                  <div className="bg-card border border-border/45 p-4 rounded-xl space-y-1 shadow">
                    <span className="text-muted-foreground font-serif text-[10px] uppercase tracking-widest">Total Pedidos</span>
                    <p className="font-serif font-bold text-lg sm:text-2xl text-foreground">
                      {stats.totalOrders}
                    </p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                      {stats.pendingOrders} en preparación / despacho
                    </p>
                  </div>

                  <div className="bg-card border border-border/45 p-4 rounded-xl space-y-1 shadow">
                    <span className="text-muted-foreground font-serif text-[10px] uppercase tracking-widest">Clientes Activos</span>
                    <p className="font-serif font-bold text-lg sm:text-2xl text-foreground">
                      {stats.totalCustomers}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Registros únicos en base de datos.</p>
                  </div>

                  <div className="bg-card border border-border/45 p-4 rounded-xl space-y-1 shadow">
                    <span className="text-muted-foreground font-serif text-[10px] uppercase tracking-widest">Taller Técnico</span>
                    <p className="font-serif font-bold text-lg sm:text-2xl text-accent">
                      {stats.pendingServiceRequests}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Reparaciones en progreso o diagnóstico.</p>
                  </div>
                </div>

                {/* Custom SVG Graphical Trend Data Viz Chart */}
                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3 shadow">
                  <span className="font-semibold text-foreground font-serif uppercase text-[9px] tracking-widest">PROGRESO MENSUAL DE FACTURACIÓN ($ ARS)</span>
                  
                  {/* Visual trend simulation using animated inline vector paths */}
                  <div className="h-44 w-full bg-background border border-border/40 rounded-lg relative overflow-hidden flex items-end px-12 pt-6">
                    {/* SVG Graphic vector paths for beautiful gradients */}
                    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <line x1="0" y1="33%" x2="100%" y2="33%" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4 4" />
                      <line x1="0" y1="66%" x2="100%" y2="66%" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4 4" />

                      {/* Area */}
                      <path 
                        d="M -20,170 Q 150,110 300,120 T 600,60 T 900,100 L 900,180 L -20,180 Z" 
                        fill="url(#chartGrad)" 
                      />

                      {/* Line */}
                      <path 
                        d="M -20,170 Q 150,110 300,120 T 600,60 T 900,100" 
                        fill="none" 
                        stroke="var(--color-accent)" 
                        strokeWidth="2.5" 
                        className="animate-pulse-subtle"
                      />
                    </svg>

                    {/* Simple months markers */}
                    <div className="absolute bottom-1 left-0 right-0 px-12 flex justify-between text-[9px] font-serif text-muted-foreground">
                      <span>Marzo</span>
                      <span>Abril</span>
                      <span>Mayo</span>
                      <span>Junio</span>
                      <span>Julio (Actual)</span>
                    </div>

                    <div className="absolute top-2 right-4 bg-accent/10 border border-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent rounded uppercase tracking-wider">
                      RECH_GRAPH: SEGUIMIENTO EN TIEMPO REAL
                    </div>
                  </div>
                </div>

                {/* Recent entries double panel lists */}
                <div className="grid gap-6 md:grid-cols-2 text-[11px]">
                  {/* Recent orders */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 shadow">
                    <span className="font-serif font-bold text-foreground">Ventas Recientes</span>
                    <div className="space-y-2">
                      {stats.recentOrders.length === 0 ? (
                        <p className="text-muted-foreground italic">No hay pedidos registrados.</p>
                      ) : (
                        stats.recentOrders.map((ord: any) => (
                          <div key={ord.id} className="flex justify-between items-center border-b border-border/10 pb-1.5 last:border-0">
                            <div>
                              <p className="font-serif font-bold text-foreground">{ord.order_number}</p>
                              <p className="text-[10px] text-muted-foreground">{ord.customer_name} · {ord.items_count} items</p>
                            </div>
                            <div className="text-right">
                              <p className="font-serif font-bold text-accent">$ {ord.total.toLocaleString("es-AR")}</p>
                              <span className="text-[9px] px-1.5 py-0.2 border border-border rounded bg-muted/40 text-foreground">{ord.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent repairs */}
                  <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 shadow">
                    <span className="font-serif font-bold text-foreground">Ingresos de Laboratorio Recientes</span>
                    <div className="space-y-2">
                      {stats.recentServiceRequests.length === 0 ? (
                        <p className="text-muted-foreground italic">No hay tickets técnicos cargados.</p>
                      ) : (
                        stats.recentServiceRequests.map((req: any) => (
                          <div key={req.id} className="flex justify-between items-center border-b border-border/10 pb-1.5 last:border-0">
                            <div>
                              <p className="font-serif font-bold text-foreground">{req.request_number}</p>
                              <p className="text-[10px] text-muted-foreground">{req.customer_name} · {req.device_type}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-foreground">{req.brand} {req.model}</p>
                              <span className="text-[9px] px-1.5 py-0.2 border border-border rounded bg-muted/40 text-foreground uppercase tracking-widest">{req.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PANEL 2: PRODUCTS CATALOG CRUD ==================== */}
            {activeTab === "products" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/30 pb-3">
                  <h2 className="font-serif text-lg font-bold text-foreground">Catálogo de Productos</h2>
                  <button
                    onClick={handleNewProductClick}
                    className="px-4 py-2 bg-accent text-accent-foreground font-serif font-bold uppercase rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Producto</span>
                  </button>
                </div>

                {/* Filtering controls bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar por nombre, marca..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <select
                    value={productCatFilter}
                    onChange={(e) => setProductCatFilter(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-accent font-serif"
                  >
                    <option value="all">Todas las Categorías</option>
                    {["Herramientas", "Insumos", "Capacitaciones", "Merchandising"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto border border-border/60 rounded-xl bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border/40 font-serif font-semibold text-foreground text-[10px] uppercase tracking-wider">
                        <th className="p-3">Detalle / Imagen</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Destacado / Activo</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-[11px]">
                      {filteredProductsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No se encontraron productos en esta selección.</td>
                        </tr>
                      ) : (
                        filteredProductsList.map((prod) => (
                          <tr key={prod.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.image_url || undefined}
                                  alt={prod.name}
                                  className="w-10 h-10 object-cover rounded bg-muted/15 border border-border/30"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <span className="text-[9px] text-accent uppercase font-serif block">{prod.brand}</span>
                                  <p className="font-semibold text-foreground truncate max-w-[200px]">{prod.name}</p>
                                  <span className="text-[10px] text-muted-foreground">{prod.category}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-serif font-bold text-foreground">
                              $ {prod.price.toLocaleString("es-AR")}
                            </td>
                            <td className="p-3">
                              <span className={`font-serif font-bold ${prod.stock <= 3 ? "text-rose-400 font-extrabold" : "text-foreground"}`}>
                                {prod.stock} un.
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-block px-1.5 py-0.2 rounded font-semibold w-fit text-[9px] ${
                                  prod.featured ? "bg-accent/15 border border-accent/20 text-accent" : "bg-muted/40 border border-border/30 text-muted-foreground"
                                }`}>
                                  {prod.featured ? "DESTACADO" : "REGULAR"}
                                </span>
                                <span className={`inline-block px-1.5 py-0.2 rounded font-semibold w-fit text-[9px] ${
                                  prod.active ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" : "bg-rose-950/40 border border-rose-500/20 text-rose-400"
                                }`}>
                                  {prod.active ? "ACTIVO" : "INACTIVO"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditProductClick(prod)}
                                  className="p-1.5 bg-muted hover:bg-accent hover:text-accent-foreground text-foreground border border-border rounded-lg transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 bg-muted hover:bg-rose-500/10 text-rose-400 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== PANEL 3: ORDERS PROCESSOR ==================== */}
            {activeTab === "orders" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="border-b border-border/30 pb-3">
                  <h2 className="font-serif text-lg font-bold text-foreground">Pedidos y Compras</h2>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por código de pedido o nombre de cliente..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="overflow-x-auto border border-border/60 rounded-xl bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border/40 font-serif font-semibold text-foreground text-[10px] uppercase tracking-wider">
                        <th className="p-3">Código / Fecha</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-[11px]">
                      {filteredOrdersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No se encontraron pedidos.</td>
                        </tr>
                      ) : (
                        filteredOrdersList.map((ord) => (
                          <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <span className="font-serif font-bold text-foreground text-sm block">{ord.order_number}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(ord.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-foreground">{ord.customer_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{ord.customer_email}</p>
                              <span className="text-[9px] uppercase font-serif text-accent block mt-0.5">{ord.delivery_method}</span>
                            </td>
                            <td className="p-3 font-serif font-bold text-foreground">
                              $ {ord.total.toLocaleString("es-AR")}
                            </td>
                            <td className="p-3">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="bg-background border border-border rounded-md px-1.5 py-1 text-[11px] text-foreground outline-none focus:border-accent"
                              >
                                {["En preparación", "Despachado", "Entregado", "Cancelado"].map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-[10px] text-muted-foreground font-mono">{ord.items_count} un.</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== PANEL 4: CUSTOMERS DIRECTORY ==================== */}
            {activeTab === "customers" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="border-b border-border/30 pb-3">
                  <h2 className="font-serif text-lg font-bold text-foreground">Clientes Registrados</h2>
                </div>

                <div className="overflow-x-auto border border-border/60 rounded-xl bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border/40 font-serif font-semibold text-foreground text-[10px] uppercase tracking-wider">
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Contacto</th>
                        <th className="p-3">Ubicación</th>
                        <th className="p-3 text-right">Historial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-[11px]">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No hay clientes registrados en la base de datos de Supabase.</td>
                        </tr>
                      ) : (
                        customers.map((cust) => (
                          <tr key={cust.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <p className="font-bold text-foreground">{cust.name}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {cust.id.slice(0, 8)}</p>
                            </td>
                            <td className="p-3 space-y-0.5">
                              <p>{cust.email}</p>
                              <p className="text-muted-foreground">{cust.phone || "Sin Teléfono"}</p>
                            </td>
                            <td className="p-3">
                              <p className="truncate max-w-[150px]">{cust.address || "N/A"}</p>
                              <p className="text-[10px] text-muted-foreground">{cust.city}, {cust.state}</p>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-[10px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded font-serif text-accent">COMPRADOR</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== PANEL 5: TECHNICAL SERVICE LABORATORY TICKETS ==================== */}
            {activeTab === "support" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="border-b border-border/30 pb-3">
                  <h2 className="font-serif text-lg font-bold text-foreground">Mesa de Servicio Técnico</h2>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por número de ticket o nombre de cliente..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="overflow-x-auto border border-border/60 rounded-xl bg-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border/40 font-serif font-semibold text-foreground text-[10px] uppercase tracking-wider">
                        <th className="p-3">Ticket / Fecha</th>
                        <th className="p-3">Equipo</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Falla / Problema</th>
                        <th className="p-3 text-right">Actualizar Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-[11px]">
                      {filteredServiceRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No hay tickets de reparación en curso.</td>
                        </tr>
                      ) : (
                        filteredServiceRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <span className="font-serif font-bold text-accent text-sm block">{req.request_number}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-foreground">{req.device_type}</p>
                              <p className="text-muted-foreground">{req.brand} {req.model}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-foreground">{req.customer_name}</p>
                              {req.customer_dni && (
                                <p className="text-[10px] text-foreground/80 font-mono font-medium">DNI: {req.customer_dni}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground">Tel: {req.phone}</p>
                            </td>
                            <td className="p-3">
                              <p className="truncate max-w-[150px] italic">"{req.problem_description}"</p>
                              {req.internal_notes && <p className="text-[10px] text-accent font-semibold mt-1">Notas: {req.internal_notes}</p>}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex flex-col items-end gap-1.5 justify-center">
                                <select
                                  value={req.status}
                                  onChange={(e) => handleUpdateServiceRequest(req.id, { status: e.target.value as any })}
                                  className="bg-background border border-border rounded-md px-1.5 py-1 text-[11px] text-foreground outline-none focus:border-accent w-full max-w-[140px]"
                                >
                                  {["Pendiente", "En diagnóstico", "Esperando aprobación", "En proceso", "Listo", "Entregado", "Cancelado"].map(st => (
                                    <option key={st} value={st}>{st.toUpperCase()}</option>
                                  ))}
                                </select>
                                
                                <button
                                  onClick={() => {
                                    setSelectedServiceRequest(req);
                                    setNewLogText("");
                                    setNewLogImage("");
                                  }}
                                  className="w-full max-w-[140px] px-2 py-1 bg-accent text-accent-foreground font-semibold rounded hover:bg-accent/90 transition-colors flex items-center justify-center gap-1 text-[10px] cursor-pointer"
                                >
                                  <span>GESTIONAR ORDEN</span>
                                  <Hammer className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== PANEL 6: COLLECTIONS / CATEGORIES EDITOR ==================== */}
            {activeTab === "collections" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="border-b border-border/30 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Gestión de Líneas de Negocio y Páginas</h2>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Modificá el contenido de las secciones principales de la tienda (Herramientas, Insumos, Capacitaciones, Merchandising) en tiempo real.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsNewCollection(true);
                      setEditingCollection({
                        id: "",
                        name: "",
                        subtitle: "",
                        description: "",
                        bg_url: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=60",
                        items_list: []
                      });
                      setIsCollectionModalOpen(true);
                    }}
                    className="px-3 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Línea</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <div key={col.id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow flex flex-col justify-between">
                      <div className="relative h-32 bg-muted overflow-hidden">
                        <img 
                          src={col.bg_url || col.bgUrl || "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=60"} 
                          alt={col.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <span className="text-[9px] uppercase font-bold text-accent tracking-wider font-mono">{col.id.toUpperCase()}</span>
                          <h4 className="font-serif font-bold text-base leading-tight">{col.name}</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 flex-grow">
                        <div>
                          <p className="text-[10px] font-semibold text-accent font-mono uppercase">{col.subtitle || "Sin subtítulo"}</p>
                          <p className="text-muted-foreground text-[11px] line-clamp-3 mt-1 leading-relaxed">
                            {col.description || "Sin descripción cargada."}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/40 border-t border-border/20 flex justify-between gap-2">
                        <button
                          onClick={() => handleDeleteCollection(col.id)}
                          className="px-3 py-1.5 bg-muted hover:bg-rose-500/10 text-rose-400 border border-border hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsNewCollection(false);
                            setEditingCollection({ ...col });
                            setIsCollectionModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors flex items-center gap-1.5 text-[11px] cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar Sección</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== PANEL 7: MERCADO PAGO CONFIGURATION ==================== */}
            {activeTab === "mercadopago" && (
              <div className="space-y-6 max-w-2xl animate-fade-in text-xs">
                <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-serif font-bold text-foreground text-lg">Configuración de Mercado Pago</h2>
                        <p className="text-xs text-muted-foreground">Configuración segura de pasarela de pago oficial con Mercado Pago.</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${mpConfig.configured ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : "bg-amber-950/40 border-amber-500/30 text-amber-400"}`}>
                        {mpConfig.configured ? "● Conectado & Listo" : "○ No Configurado"}
                      </span>
                    </div>
                  </div>

                  {mpMessage.text && (
                    <div className={`p-3 rounded-lg text-xs font-sans ${mpMessage.type === "success" ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-300" : "bg-rose-950/30 border border-rose-500/30 text-rose-300"}`}>
                      {mpMessage.text}
                    </div>
                  )}

                  {/* Estado de Seguridad del Servidor */}
                  <div className="bg-background/80 border border-border/70 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Aislamiento de Credenciales (Producción)</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                        Variables de Entorno
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Por estrictas directivas de seguridad, el <strong>Access Token</strong> y el <strong>Webhook Secret</strong> se administran exclusivamente mediante variables de entorno del servidor (<code>MERCADOPAGO_ACCESS_TOKEN</code> y <code>MERCADOPAGO_WEBHOOK_SECRET</code>), impidiendo cualquier exposición en bases de datos o clientes.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div className="p-2 bg-card rounded border border-border/40">
                        <span className="text-muted-foreground block text-[9px]">ACCESS TOKEN:</span>
                        <span className={mpConfig.configured ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {mpConfig.configured ? "● Configurado en Servidor" : "○ Pendiente en .env"}
                        </span>
                      </div>
                      <div className="p-2 bg-card rounded border border-border/40">
                        <span className="text-muted-foreground block text-[9px]">FIRMA WEBHOOK HMAC:</span>
                        <span className={mpConfig.webhookConfigured ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {mpConfig.webhookConfigured ? "● Validada con x-signature" : "○ Secret Pendiente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveMpConfig} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Public Key *</span>
                        <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noreferrer" className="text-[10px] text-accent underline">
                          Obtener en Developers
                        </a>
                      </label>
                      <input
                        type="text"
                        placeholder="APP_USR-xxxx-xxxx..."
                        value={mpConfig.publicKey}
                        onChange={(e) => setMpConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Clave pública para inicializar el SDK de Mercado Pago en el frontend.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                      <input
                        type="checkbox"
                        id="mp-sandbox-toggle"
                        checked={mpConfig.sandbox}
                        onChange={(e) => setMpConfig(prev => ({ ...prev, sandbox: e.target.checked }))}
                        className="h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent"
                      />
                      <label htmlFor="mp-sandbox-toggle" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                        Modo Sandbox de Pruebas (utiliza tarjetas de test)
                      </label>
                    </div>

                    {mpConfig.updated_at && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Última sincronización: {new Date(mpConfig.updated_at).toLocaleString("es-AR")}
                      </p>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={mpSaving}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-5 py-2.5 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{mpSaving ? "Guardando..." : "Guardar Configuración"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-card border border-border/40 rounded-xl p-5 space-y-2 text-xs text-muted-foreground">
                  <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Guía de Configuración Oficial de Mercado Pago</span>
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>Accedé a <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noreferrer" className="text-accent underline font-semibold">mercadopago.com.ar/developers</a> y creá tu aplicación.</li>
                    <li>Configurá <code>MERCADOPAGO_ACCESS_TOKEN</code> y <code>MERCADOPAGO_WEBHOOK_SECRET</code> en el archivo <code>.env</code> del servidor.</li>
                    <li>En <strong>Notificaciones IPN / Webhooks</strong>, configurá la URL: <code>https://tu-dominio.com/api/mercadopago/webhook</code> para el evento <code>payment</code>.</li>
                    <li>Pegá tu <strong>Public Key</strong> arriba y guardá los cambios para habilitar los pagos a tus clientes.</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ==================== SUB-MODAL: PRODUCT CREATION & EDITION ==================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl p-6 space-y-4 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h3 className="font-serif font-bold text-base text-foreground">
                {editingProduct.id ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button 
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      setEditingProduct(prev => {
                        if (!prev) return null;
                        const update = { ...prev, name: nameVal };
                        if (!prev.id) {
                          // Clean slugifier helper
                          update.slug = nameVal
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") // remove accents
                            .replace(/[^\w\s-]/g, "")        // remove non-word chars
                            .trim()
                            .replace(/[\s_]+/g, "-")         // spaces to hyphens
                            .replace(/^-+|-+$/g, "");        // clean start/end
                        }
                        return update;
                      });
                    }}
                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Slug Único *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.slug || ""}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    placeholder="ej: notebook-asus-zenbook"
                    className="w-full bg-background border border-border rounded p-2 text-foreground font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Categoría *</label>
                  <select
                    value={editingProduct.category || "Herramientas"}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                  >
                    {["Herramientas", "Insumos", "Capacitaciones", "Merchandising"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Línea de Negocio</label>
                  <select
                    value={editingProduct.collection || ""}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, collection: e.target.value || undefined } : null)}
                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                  >
                    <option value="">Ninguna</option>
                    <option value="herramientas">Herramientas de Precisión</option>
                    <option value="insumos">Insumos & Repuestos</option>
                    <option value="capacitaciones">Capacitaciones</option>
                    <option value="merchandising">Merchandising Dr Tecno</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Marca *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand || ""}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, brand: e.target.value } : null)}
                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Precio ($ ARS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                    className="w-full bg-background border border-border rounded p-2 text-foreground font-serif font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Stock *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, stock: parseInt(e.target.value) } : null)}
                    className="w-full bg-background border border-border rounded p-2 text-foreground font-serif"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Badge Decorativo</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ""}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, badge: e.target.value } : null)}
                    placeholder="Ej: 10% OFF, NUEVO"
                    className="w-full bg-background border border-border rounded p-2 text-foreground"
                  />
                </div>
              </div>

              <ImageUploadSelector
                label="Imagen Principal del Producto"
                value={editingProduct.image_url || ""}
                onChange={(val) => setEditingProduct(prev => prev ? { ...prev, image_url: val } : null)}
                placeholder="Pegar URL de la imagen del producto..."
              />

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Descripción Corta *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.short_description || ""}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, short_description: e.target.value } : null)}
                  className="w-full bg-background border border-border rounded p-2 text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Descripción Detallada</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full bg-background border border-border rounded p-2 text-foreground resize-none"
                />
              </div>

              {/* Specifications Sub-builder */}
              <div className="border border-border/50 rounded-lg p-3 space-y-2">
                <span className="font-serif font-bold text-[10px] text-foreground uppercase tracking-wider block">Especificaciones Técnicas</span>
                
                {/* Specifications List */}
                {editingProduct.specifications && Object.keys(editingProduct.specifications).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2 max-h-24 overflow-y-auto">
                    {Object.entries(editingProduct.specifications).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between bg-muted px-2 py-1 rounded border border-border/30">
                        <span className="truncate max-w-[80px] font-semibold">{k}: {v}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSpecification(k)}
                          className="text-rose-400 hover:text-rose-500 font-bold px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Spec inputs */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Clave (Ej: Procesador)"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    className="w-1/2 bg-background border border-border rounded p-1.5 text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Valor (Ej: Intel i7)"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    className="w-1/2 bg-background border border-border rounded p-1.5 text-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="px-3 bg-accent text-accent-foreground rounded font-bold font-serif"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={!!editingProduct.featured}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, featured: e.target.checked } : null)}
                    className="accent-accent"
                  />
                  <label htmlFor="featured" className="font-semibold text-foreground cursor-pointer select-none">Destacado en Portada</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingProduct.active !== undefined ? !!editingProduct.active : true}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, active: e.target.checked } : null)}
                    className="accent-accent"
                  />
                  <label htmlFor="active" className="font-semibold text-foreground cursor-pointer select-none">Producto Activo en Tienda</label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-accent text-accent-foreground font-serif font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SUB-MODAL: COLLECTION CREATION & EDITION ==================== */}
      {isCollectionModalOpen && editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h3 className="font-serif font-bold text-base text-foreground">
                {isNewCollection ? "Nueva Línea de Negocio" : "Editar Línea de Negocio"}
              </h3>
              <button 
                onClick={() => {
                  setIsCollectionModalOpen(false);
                  setEditingCollection(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveCollection(); }} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Identificador único (ID en minúsculas) *</label>
                <input
                  type="text"
                  required
                  disabled={!isNewCollection}
                  placeholder="Ej: herramientas"
                  value={editingCollection.id || ""}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setEditingCollection(prev => prev ? { ...prev, id: val } : null);
                  }}
                  className="w-full bg-background border border-border rounded p-2 text-foreground disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Nombre de la Línea *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Herramientas"
                  value={editingCollection.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCollection(prev => {
                      if (!prev) return null;
                      const next = { ...prev, name: val };
                      if (isNewCollection && !prev.id) {
                        next.id = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      }
                      return next;
                    });
                  }}
                  className="w-full bg-background border border-border rounded p-2 text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Subtítulo de Portada</label>
                <input
                  type="text"
                  placeholder="Ej: Equipos profesionales"
                  value={editingCollection.subtitle || ""}
                  onChange={(e) => setEditingCollection(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                  className="w-full bg-background border border-border rounded p-2 text-foreground"
                />
              </div>

              <ImageUploadSelector
                label="Imagen de Portada / Banner"
                value={editingCollection.bg_url || ""}
                onChange={(val) => setEditingCollection(prev => prev ? { ...prev, bg_url: val } : null)}
                placeholder="Pegar URL de la imagen de fondo de la sección..."
              />

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Descripción de la Sección *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Breve descripción de los productos de esta sección..."
                  value={editingCollection.description || ""}
                  onChange={(e) => setEditingCollection(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full bg-background border border-border rounded p-2 text-foreground resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-accent text-accent-foreground font-serif font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
              >
                Guardar Línea
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SUB-MODAL: TECHNICAL SERVICE ORDER MANAGEMENT ==================== */}
      {selectedServiceRequest && (() => {
        const metadata = parseServiceMetadata(selectedServiceRequest.internal_notes);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl p-6 space-y-5 animate-scale-up my-8 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div>
                  <span className="text-[10px] text-accent font-mono uppercase tracking-widest">Servicio Técnico Dr Tecno</span>
                  <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-1.5 mt-0.5">
                    <Hammer className="w-5 h-5 text-accent" />
                    <span>Gestionar Orden: {selectedServiceRequest.request_number}</span>
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedServiceRequest(null);
                    setNewLogText("");
                    setNewLogImage("");
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informative grid about client & device */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-muted/40 border border-border/30 rounded-lg text-[11px] leading-normal">
                <div>
                  <span className="text-muted-foreground block font-mono text-[9px] uppercase font-bold">Cliente</span>
                  <span className="font-bold text-foreground block">{selectedServiceRequest.customer_name}</span>
                  {selectedServiceRequest.customer_dni && (
                    <span className="text-muted-foreground font-mono block">DNI: {selectedServiceRequest.customer_dni}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block font-mono text-[9px] uppercase font-bold">Teléfono</span>
                  <span className="text-foreground font-semibold block">{selectedServiceRequest.phone}</span>
                  <span className="text-muted-foreground block">{selectedServiceRequest.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-mono text-[9px] uppercase font-bold">Dispositivo</span>
                  <span className="font-bold text-accent block">{selectedServiceRequest.device_type}</span>
                  <span className="text-muted-foreground block">{selectedServiceRequest.brand} {selectedServiceRequest.model}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-mono text-[9px] uppercase font-bold">Ingreso Registrado</span>
                  <span className="text-foreground font-medium block">{new Date(selectedServiceRequest.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Status and Physical Receipt Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">Estado General de Reparación</label>
                    <select
                      value={selectedServiceRequest.status}
                      onChange={(e) => handleUpdateServiceRequest(selectedServiceRequest.id, { status: e.target.value as any })}
                      className="w-full bg-background border border-border rounded p-2 text-foreground font-medium outline-none focus:border-accent"
                    >
                      {["Pendiente", "En diagnóstico", "Esperando aprobación", "En proceso", "Listo", "Entregado", "Cancelado"].map(st => (
                        <option key={st} value={st}>{st.toUpperCase()}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Define qué etapa de la reparación se le comunica al cliente online.</p>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={metadata.physical_received}
                        onChange={(e) => handleSaveServiceMetadata({ physical_received: e.target.checked })}
                        className="h-4.5 w-4.5 text-accent bg-background border-border rounded focus:ring-accent accent-accent cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-foreground block text-[11px]">Equipo Recibido Físicamente</span>
                        <span className="text-[9.5px] text-muted-foreground block leading-normal">Activa el cambio de etapa "Turno Registrado" a "Ingresado a Laboratorio".</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Photo Reception Controls */}
                <div className="border border-border/40 p-4 rounded-xl space-y-3 bg-muted/20">
                  <ImageUploadSelector
                    label="1. Llave de Recibido (Foto de Ingreso del Equipo)"
                    value={metadata.received_image || ""}
                    onChange={(val) => handleSaveServiceMetadata({ received_image: val })}
                    placeholder="Pegar URL de la imagen de recepción..."
                  />
                  {/* Presets to quickly test photo upload */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono mr-1">Test Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSaveServiceMetadata({ received_image: "https://images.unsplash.com/photo-1595115815610-ed609f7a9117?w=600" })}
                      className="px-2 py-0.5 bg-background border border-border hover:border-accent text-foreground text-[10px] rounded transition-colors"
                    >
                      📱 Pantalla Rota
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveServiceMetadata({ received_image: "https://images.unsplash.com/photo-1601524909162-be87252be298?w=600" })}
                      className="px-2 py-0.5 bg-background border border-border hover:border-accent text-foreground text-[10px] rounded transition-colors"
                    >
                      ⚡ Placa Dañada
                    </button>
                  </div>
                </div>

                {/* 3. History logs & Fallas Resolution */}
                <div className="border border-border/40 p-4 rounded-xl space-y-4 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-xs text-foreground block">2. Historial del Arreglo (Diagnóstico y Trabajos)</span>
                    <span className="text-[10px] font-mono text-accent">{metadata.diagnosis_history?.length || 0} Registros</span>
                  </div>

                  {/* List existing logs */}
                  {metadata.diagnosis_history && metadata.diagnosis_history.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {metadata.diagnosis_history.map((log, index) => (
                        <div key={index} className="p-2.5 bg-background border border-border/60 rounded-lg flex gap-3 justify-between items-start">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[9px] font-mono">
                              <span className="text-accent font-bold">{log.date}</span>
                              <span className="text-muted-foreground">Log #{index + 1}</span>
                            </div>
                            <p className="text-[10.5px] text-foreground leading-relaxed font-sans">{log.text}</p>
                            {log.image && (
                              <div className="inline-block mt-1 border border-border/20 rounded overflow-hidden bg-black/10">
                                <img src={log.image || undefined} alt="Log work preview" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedLogs = [...metadata.diagnosis_history!];
                              updatedLogs.splice(index, 1);
                              handleSaveServiceMetadata({ diagnosis_history: updatedLogs });
                            }}
                            className="p-1 text-rose-400 hover:text-rose-500 hover:bg-rose-950/20 rounded transition-colors cursor-pointer shrink-0"
                            title="Eliminar este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">No hay registros cargados en el historial de reparación. El cliente verá la descripción de falla inicial.</p>
                  )}

                  {/* Form to add a new step log */}
                  <div className="bg-background border border-border p-3 rounded-lg space-y-3">
                    <span className="font-semibold text-foreground text-[10px] block uppercase tracking-wider">Agregar Avance de Trabajo:</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-semibold">Detalle del avance o diagnóstico realizado:</label>
                      <input
                        type="text"
                        placeholder="Ej: Se soldó el pin de carga nuevo y se probaron tensiones de entrada."
                        value={newLogText}
                        onChange={(e) => setNewLogText(e.target.value)}
                        className="w-full bg-muted border border-border rounded p-2 text-foreground text-[11px]"
                      />
                    </div>

                    <ImageUploadSelector
                      label="Imagen del Trabajo en Curso (Opcional)"
                      value={newLogImage}
                      onChange={(val) => setNewLogImage(val)}
                      placeholder="Pegar URL de foto de microscopio, soldadura..."
                    />
                    {/* Presets to quickly test process image */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[9px] text-muted-foreground uppercase font-mono">Test Presets:</span>
                      <button
                        type="button"
                        onClick={() => setNewLogImage("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600")}
                        className="px-1.5 py-0.5 bg-background border border-border hover:border-accent text-foreground text-[9px] rounded"
                      >
                        🔬 Microscopio Placa
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewLogImage("https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600")}
                        className="px-1.5 py-0.5 bg-background border border-border hover:border-accent text-foreground text-[9px] rounded"
                      >
                        🛠️ Osciloscopio/Técnico
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!newLogText.trim()}
                      onClick={async () => {
                        const newLog = {
                          date: new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
                          text: newLogText.trim(),
                          image: newLogImage.trim() || undefined
                        };
                        const updatedLogs = [...(metadata.diagnosis_history || []), newLog];
                        await handleSaveServiceMetadata({ diagnosis_history: updatedLogs });
                        setNewLogText("");
                        setNewLogImage("");
                      }}
                      className="w-full py-1.5 bg-accent text-accent-foreground font-bold rounded hover:opacity-90 disabled:opacity-40 transition-colors text-[10.5px] cursor-pointer"
                    >
                      REGISTRAR AVANCE EN HISTORIAL
                    </button>
                  </div>
                </div>

                {/* 4. Repaired Device photo */}
                <div className="border border-border/40 p-4 rounded-xl space-y-3 bg-muted/20">
                  <ImageUploadSelector
                    label="3. Imagen del Dispositivo Terminado (Una vez reparado)"
                    value={metadata.repaired_image || ""}
                    onChange={(val) => handleSaveServiceMetadata({ repaired_image: val })}
                    placeholder="Pegar URL de la imagen del equipo finalizado..."
                  />
                  {/* Preset to quickly test repaired image */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono mr-1">Test Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSaveServiceMetadata({ repaired_image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600" })}
                      className="px-2 py-0.5 bg-background border border-border hover:border-accent text-foreground text-[10px] rounded transition-colors"
                    >
                      ✨ Equipo Reparado Impecable
                    </button>
                  </div>
                </div>

                {/* 5. Plain Notes Input (Fallback and general details) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Notas Adicionales del Técnico (Públicas)</label>
                  <textarea
                    rows={2}
                    value={metadata.plain_notes || ""}
                    placeholder="Escribir cualquier nota aclaratoria general que se mostrará como Notas del Diagnóstico al cliente..."
                    onChange={(e) => handleSaveServiceMetadata({ plain_notes: e.target.value })}
                    className="w-full bg-background border border-border rounded p-2 text-foreground leading-normal resize-none"
                  />
                </div>

              </div>

              <div className="border-t border-border/30 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceRequest(null);
                    setNewLogText("");
                    setNewLogImage("");
                  }}
                  className="px-4 py-2 bg-muted text-foreground border border-border font-bold uppercase rounded-lg hover:bg-muted/80 text-[10px] cursor-pointer"
                >
                  Cerrar Gestor de Orden
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
