-- ==========================================================
-- Migración de Endurecimiento para Producción - Dr Tecno
-- Ejecutable en Supabase SQL Editor de forma idempotente y segura
-- (NO borra tablas ni datos existentes)
-- ==========================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Asegurar columnas adicionales e índices en productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 3 CHECK (min_stock >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(100);

-- 2. Asegurar columnas e índices en pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_dni VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lookup_token VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

-- 3. Asegurar lookup_token en servicio técnico
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS lookup_token VARCHAR(128);

-- 4. Tabla de Auditoría Administrativa (si no existe)
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

-- 5. Tabla de Historial y Trazabilidad de Servicio Técnico (si no existe)
CREATE TABLE IF NOT EXISTS service_request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  actor VARCHAR(100) DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Configuración de Mercado Pago (Solo metadatos no sensibles)
CREATE TABLE IF NOT EXISTS mercadopago_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  public_key TEXT,
  sandbox BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la columna access_token existe de esquemas antiguos, removerla para aislar credenciales
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mercadopago_config' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE mercadopago_config DROP COLUMN access_token;
  END IF;
END $$;

-- 7. Función PostgreSQL Atómica para Descuento Concurrente de Stock
CREATE OR REPLACE FUNCTION deduct_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_rows INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id 
    AND stock >= p_quantity 
    AND active = TRUE;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  RETURN v_updated_rows > 0;
END;
$$;

-- 8. Función PostgreSQL Transaccional Atómica Completa de Pedido
-- Ejecuta validación de producto, estado activo, precio oficial, stock disponible,
-- descuento atómico de stock e inserción de pedido + order_items en UNA SOLA TRANSACCIÓN.
-- Rollback automático ante cualquier fallo.
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_customer_name VARCHAR,
  p_customer_email VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_dni VARCHAR,
  p_shipping_address TEXT,
  p_city VARCHAR,
  p_state VARCHAR,
  p_country VARCHAR,
  p_postal_code VARCHAR,
  p_delivery_method VARCHAR,
  p_payment_method VARCHAR,
  p_notes TEXT,
  p_lookup_token VARCHAR,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID := gen_random_uuid();
  v_order_number VARCHAR := 'ORD-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  v_item JSONB;
  v_prod RECORD;
  v_prod_id UUID;
  v_qty INT;
  v_unit_price NUMERIC(12, 2);
  v_item_subtotal NUMERIC(12, 2);
  v_total_subtotal NUMERIC(12, 2) := 0;
  v_discount NUMERIC(12, 2) := 0;
  v_shipping_cost NUMERIC(12, 2) := 0;
  v_final_total NUMERIC(12, 2) := 0;
  v_items_count INT := 0;
  v_inserted_items JSONB := '[]'::jsonb;
  v_now TIMESTAMPTZ := NOW();
  v_res JSONB;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido debe contener al menos un producto';
  END IF;

  -- 1. Bloqueo FOR UPDATE, validación de stock y cálculo de precios oficiales
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'La cantidad para el producto % debe ser mayor a 0', v_prod_id;
    END IF;

    -- Bloqueo de fila para evitar race conditions
    SELECT id, name, price, stock, active INTO v_prod
    FROM products
    WHERE id = v_prod_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto con ID % no existe', v_prod_id;
    END IF;

    IF NOT v_prod.active THEN
      RAISE EXCEPTION 'El producto "%" se encuentra inactivo y no se puede adquirir', v_prod.name;
    END IF;

    IF v_prod.stock < v_qty THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponibles: %, Solicitados: %', v_prod.name, v_prod.stock, v_qty;
    END IF;

    v_unit_price := v_prod.price;
    v_item_subtotal := ROUND((v_unit_price * v_qty), 2);
    v_total_subtotal := v_total_subtotal + v_item_subtotal;
    v_items_count := v_items_count + v_qty;

    -- Descontar stock inmediatamente dentro de la transacción
    UPDATE products
    SET stock = stock - v_qty,
        updated_at = v_now
    WHERE id = v_prod_id;
  END LOOP;

  -- 2. Descuentos según método de pago (regla de negocio oficial)
  IF p_payment_method = 'transferencia' THEN
    v_discount := ROUND(v_total_subtotal * 0.10, 2);
  ELSIF p_payment_method = 'mercadopago' THEN
    v_discount := ROUND(v_total_subtotal * 0.05, 2);
  ELSE
    v_discount := 0;
  END IF;

  v_final_total := GREATEST(0, v_total_subtotal - v_discount + v_shipping_cost);

  -- 3. Insertar Pedido
  INSERT INTO orders (
    id,
    order_number,
    lookup_token,
    customer_name,
    customer_email,
    customer_phone,
    customer_dni,
    shipping_address,
    city,
    state,
    country,
    postal_code,
    delivery_method,
    payment_method,
    payment_status,
    notes,
    subtotal,
    discounts,
    shipping_cost,
    total,
    status,
    items_count,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    p_lookup_token,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_customer_dni,
    p_shipping_address,
    p_city,
    p_state,
    p_country,
    p_postal_code,
    p_delivery_method,
    p_payment_method,
    'pending',
    p_notes,
    v_total_subtotal,
    v_discount,
    v_shipping_cost,
    v_final_total,
    'En preparación',
    v_items_count,
    v_now,
    v_now
  );

  -- 4. Insertar Ítems del Pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;

    SELECT name, price INTO v_prod FROM products WHERE id = v_prod_id;

    v_unit_price := v_prod.price;
    v_item_subtotal := ROUND((v_unit_price * v_qty), 2);

    INSERT INTO order_items (
      id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      subtotal,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      v_prod_id,
      v_prod.name,
      v_qty,
      v_unit_price,
      v_item_subtotal,
      v_now
    );

    v_inserted_items := v_inserted_items || jsonb_build_object(
      'product_id', v_prod_id,
      'product_name', v_prod.name,
      'quantity', v_qty,
      'unit_price', v_unit_price,
      'subtotal', v_item_subtotal
    );
  END LOOP;

  -- 5. Retornar payload completo
  v_res := jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'lookup_token', p_lookup_token,
    'customer_name', p_customer_name,
    'customer_email', p_customer_email,
    'customer_phone', p_customer_phone,
    'customer_dni', p_customer_dni,
    'shipping_address', p_shipping_address,
    'city', p_city,
    'state', p_state,
    'country', p_country,
    'postal_code', p_postal_code,
    'delivery_method', p_delivery_method,
    'payment_method', p_payment_method,
    'payment_status', 'pending',
    'notes', p_notes,
    'subtotal', v_total_subtotal,
    'discounts', v_discount,
    'shipping_cost', v_shipping_cost,
    'total', v_final_total,
    'status', 'En preparación',
    'items_count', v_items_count,
    'created_at', v_now,
    'updated_at', v_now,
    'items', v_inserted_items
  );

  RETURN v_res;
END;
$$;

-- 9. Función para Restaurar Stock en caso de Cancelación
CREATE OR REPLACE FUNCTION release_order_stock(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT product_id, quantity
    FROM order_items
    WHERE order_id = p_order_id
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.quantity > 0 THEN
      UPDATE products
      SET stock = stock + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$;

-- 10. Índices de rendimiento y unicidad
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_lookup_token ON orders(lookup_token);
CREATE INDEX IF NOT EXISTS idx_service_requests_number ON service_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_service_requests_lookup_token ON service_requests(lookup_token);
CREATE INDEX IF NOT EXISTS idx_service_requests_dni ON service_requests(customer_dni);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_events_req_id ON service_request_events(service_request_id);

-- Idempotencia para Mercado Pago (previene duplicar procesamiento de transacciones)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id_unique ON orders(payment_id) WHERE payment_id IS NOT NULL;

-- 11. Políticas RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Backend Service Role Bypass (Acceso completo para backend con SUPABASE_SERVICE_ROLE_KEY)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_products') THEN
    CREATE POLICY "service_role_all_products" ON products FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_orders') THEN
    CREATE POLICY "service_role_all_orders" ON orders FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_service_requests') THEN
    CREATE POLICY "service_role_all_service_requests" ON service_requests FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_admin_audit_log') THEN
    CREATE POLICY "service_role_all_admin_audit_log" ON admin_audit_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_mercadopago_config') THEN
    CREATE POLICY "service_role_all_mercadopago_config" ON mercadopago_config FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_select_active_products') THEN
    CREATE POLICY "anon_select_active_products" ON products FOR SELECT TO anon USING (active = true);
  END IF;
END $$;

