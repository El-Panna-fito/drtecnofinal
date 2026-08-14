-- ==========================================================
-- SQL Schema Completo para Dr Tecno - E-Commerce & Servicio Técnico
-- Compatible con PostgreSQL 14+ y Supabase
-- ==========================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios Administradores (Bcrypt Passwords & Roles)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(150),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'operador')),
  active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Colecciones
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  bg_url TEXT,
  items_list JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Productos (Herramientas, Insumos, Cursos, Merch, Repuestos)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  collection VARCHAR(100) REFERENCES collections(id) ON DELETE SET NULL,
  brand VARCHAR(100),
  price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  previous_price NUMERIC(14,2),
  wholesale_price NUMERIC(14,2),
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER DEFAULT 3 CHECK (min_stock >= 0),
  featured BOOLEAN DEFAULT FALSE,
  badge VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  dni VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Argentina',
  postal_code VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_dni VARCHAR(50),
  shipping_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Argentina',
  postal_code VARCHAR(30),
  delivery_method VARCHAR(100) DEFAULT 'envio',
  payment_method VARCHAR(100) DEFAULT 'efectivo',
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  payment_id VARCHAR(100),
  external_reference VARCHAR(100),
  notes TEXT,
  subtotal NUMERIC(14,2) NOT NULL,
  discounts NUMERIC(14,2) DEFAULT 0,
  shipping_cost NUMERIC(14,2) DEFAULT 0,
  total NUMERIC(14,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'En preparación',
  items_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Items de Pedidos
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de Solicitudes de Servicio Técnico
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  customer_dni VARCHAR(50),
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('Celular', 'PC de escritorio', 'Notebook')),
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('Reparación', 'Mantenimiento')),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_imei VARCHAR(100),
  problem_description TEXT NOT NULL,
  diagnosis TEXT,
  estimated_price NUMERIC(14,2),
  internal_notes TEXT,
  public_notes TEXT,
  estimated_delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En diagnóstico', 'Esperando aprobación', 'En proceso', 'Listo', 'Entregado', 'Cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla de Historial y Trazabilidad de Servicio Técnico
CREATE TABLE IF NOT EXISTS service_request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  actor VARCHAR(100) DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabla de Configuración de Mercado Pago
CREATE TABLE IF NOT EXISTS mercadopago_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  access_token TEXT,
  public_key TEXT,
  sandbox BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabla de Configuraciones de la Tienda
CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR(50) PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabla de Auditoría Administrativa (Audit Log)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_username VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_number ON service_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_service_requests_dni ON service_requests(customer_dni);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_request_events_req_id ON service_request_events(service_request_id);

-- ==========================================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Backend Service Role Bypass (Full access for API backend)
CREATE POLICY "service_role_all_products" ON products FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_collections" ON collections FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_customers" ON customers FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_orders" ON orders FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_order_items" ON order_items FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_service_requests" ON service_requests FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_service_request_events" ON service_request_events FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_admin_users" ON admin_users FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_mercadopago_config" ON mercadopago_config FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_store_settings" ON store_settings FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_role_all_admin_audit_log" ON admin_audit_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Anon / Public Read-Only Access for Public Catalog
CREATE POLICY "anon_select_active_products" ON products FOR SELECT TO anon USING (active = true);
CREATE POLICY "anon_select_collections" ON collections FOR SELECT TO anon USING (TRUE);
CREATE POLICY "anon_insert_service_requests" ON service_requests FOR INSERT TO anon WITH CHECK (TRUE);
CREATE POLICY "anon_select_service_requests_by_number" ON service_requests FOR SELECT TO anon USING (TRUE);

-- ==========================================================
-- SEED DATA INICIAL
-- ==========================================================

-- Admin inicial: admin@dr-tecno.com.ar (Bcrypt hash para 'Drtecno2026.')
INSERT INTO admin_users (username, password_hash, email, name, role)
VALUES ('admin@dr-tecno.com.ar', '$2a$12$R.P.20eN9o4R21tT0H4cguL/k2H7oV0vS8L0z6M8T4u4y5.6c.W6i', 'admin@dr-tecno.com.ar', 'Administrador Principal Dr Tecno', 'superadmin')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Colecciones Iniciales
INSERT INTO collections (id, name, subtitle, description, bg_url, items_list) VALUES
('herramientas', 'Herramientas de Precisión', 'Microelectrónica & Reparación', 'Equipamiento profesional indispensable para la apertura, diagnóstico y reparación de placas lógicas, micro-soldadura SMD y armado de celulares, notebooks y computadoras.', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80', '["Estaciones de Soldado Inteligentes", "Microscopios Trioculares con Cámara", "Kits de Destornilladores de Precisión", "Mantas Antiestáticas Magnéticas"]'::jsonb),
('insumos', 'Insumos & Repuestos OEM', 'Componentes de Calidad Certificada', 'Repuestos y consumibles originales para restaurar dispositivos con la máxima confiabilidad: módulos de pantalla OLED, baterías de alta capacidad, flux y estaño para soldadura.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&auto=format&fit=crop&q=80', '["Módulos de Pantalla OLED / AMOLED", "Baterías de Litio 0 Ciclos", "Adhesivos B7000 / T7000 Especiales", "Flux Amtech & Estaño en Pasta"]'::jsonb),
('capacitaciones', 'Capacitaciones & Cursos', 'De Cero a Técnico Especialista', 'Cursos prácticos presenciales y online dictados por ingenieros y técnicos de Dr Tecno. Domina la detección de fallas en placa, lectura de esquemáticos y reballing profesional.', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80', '["Curso de Reparación Nivel Inicial", "Curso de Reparación Nivel Intermedio", "Curso de Microelectrónica Avanzado", "Certificaciones Oficiales de Dr Tecno"]'::jsonb),
('merchandising', 'Merchandising Dr Tecno', 'Remeras & Accesorios de Taller', 'Lleva tu pasión por la electrónica y el taller con orgullo. Nuestra línea de indumentaria y accesorios oficiales de Dr Tecno está diseñada para técnicos entusiastas.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80', '["Remera Oficial Lab Edition", "Gorra Trucker Dr Tecno", "Taza de Cerámica Integrated Circuit", "Accesorios & Stickers para tu taller"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
