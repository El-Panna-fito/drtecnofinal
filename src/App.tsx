import React from "react";
import { Router, useNavigate } from "./components/router.js";
import { CartProvider } from "./components/cart/cart-provider.js";
import { CartSheet } from "./components/cart/cart-sheet.js";
import { Navigation } from "./components/navigation.js";
import { Footer } from "./components/footer.js";
import { ChatWidget } from "./components/chat-widget.js";
import { PageTransitionOverlay } from "./components/logo-transition.js";

// Page imports
import { HomePage } from "./pages/home.js";
import { CatalogPage } from "./pages/catalogo.js";
import { CollectionsPage } from "./pages/colecciones.js";
import { ProductDetallePage } from "./pages/producto-detalle.js";
import { QuizPage } from "./pages/quiz.js";
import { ServicioTecnicoPage } from "./pages/servicio-tecnico.js";
import { CheckoutPage } from "./pages/checkout.js";
import { OrderConfirmacionPage } from "./pages/pedido-confirmacion.js";
import { SobreNosotrosPage } from "./pages/sobre-nosotros.js";
import { ContactoPage } from "./pages/contacto.js";
import { AdminDashboardPage } from "./pages/admin-dashboard.js";

const PageRenderer: React.FC = () => {
  const { path } = useNavigate();

  // Root and core pages
  if (path === "/" || path === "/inicio") {
    return <HomePage />;
  }
  if (path === "/catalogo") {
    return <CatalogPage />;
  }
  if (path === "/colecciones") {
    return <CollectionsPage />;
  }
  if (path === "/quiz") {
    return <QuizPage />;
  }
  if (path === "/servicio-tecnico") {
    return <ServicioTecnicoPage />;
  }
  if (path === "/checkout") {
    return <CheckoutPage />;
  }
  if (path === "/sobre-nosotros") {
    return <SobreNosotrosPage />;
  }
  if (path === "/contacto") {
    return <ContactoPage />;
  }
  if (path === "/admin") {
    return <AdminDashboardPage />;
  }

  // Dynamic parameterized routes
  if (path.startsWith("/producto/")) {
    const slug = path.split("/producto/")[1];
    return <ProductDetallePage slug={slug} />;
  }
  if (path.startsWith("/pedido/")) {
    const orderNumber = path.split("/pedido/")[1];
    return <OrderConfirmacionPage orderNumber={orderNumber} />;
  }

  // 404 Fallback
  return (
    <div className="container mx-auto px-4 py-24 text-center space-y-6 font-sans tech-bg">
      <h1 className="font-serif text-5xl font-bold text-accent">404</h1>
      <h2 className="font-serif text-2xl font-semibold text-foreground">Página no encontrada</h2>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
        El componente de hardware que estás buscando fue desinstalado o no existe en los directorios de Dr Tecno.
      </p>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState(null, "", "/");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        className="inline-block px-5 py-2.5 bg-accent text-accent-foreground text-xs font-serif font-bold uppercase rounded-lg hover:bg-accent/95 transition-all"
      >
        Volver al Inicio
      </a>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/30 selection:text-accent">
          {/* Main Navigation Header */}
          <Navigation />

          {/* Full-screen route transition curtain overlay styled in brand logo colors and icons */}
          <PageTransitionOverlay />

          {/* Cart Drawer Overlay */}
          <CartSheet />

          {/* Core Content Area */}
          <div className="flex-1">
            <PageRenderer />
          </div>

          {/* Floating interactive T-Bot chatbot assistance */}
          <ChatWidget />

          {/* Footer information blocks */}
          <Footer />
        </div>
      </CartProvider>
    </Router>
  );
}
