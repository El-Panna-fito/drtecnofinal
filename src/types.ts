// Types definition for Dr Tecno e-commerce app

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string | null;
  brand: string | null;
  price: number;
  previous_price?: number | null;
  wholesale_price?: number | null;
  sku?: string | null;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  images: string[]; // Additional images URLs
  specifications: Record<string, string>;
  stock: number;
  min_stock?: number;
  featured: boolean;
  badge: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  dni?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  created_at?: string;
  updated_at?: string;
}

export type OrderCommercialStatus = 
  | 'nuevo' 
  | 'En preparación' 
  | 'Probado' 
  | 'listo_para_retiro' 
  | 'Despachado' 
  | 'Entregado' 
  | 'Cancelado';

export type OrderPaymentStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  lookup_token?: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_dni?: string | null;
  shipping_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  delivery_method: string | null;
  payment_method?: string | null;
  payment_status?: OrderPaymentStatus;
  payment_id?: string | null;
  external_reference?: string | null;
  notes: string | null;
  subtotal: number;
  discounts?: number;
  shipping_cost?: number;
  total: number;
  status: OrderCommercialStatus;
  items_count: number;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  brand?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
}

export type ServiceRequestStatus = 
  | 'Pendiente' 
  | 'En diagnóstico' 
  | 'Esperando aprobación' 
  | 'En proceso' 
  | 'Listo' 
  | 'Entregado' 
  | 'Cancelado';

export interface ServiceRequest {
  id: string;
  request_number: string;
  lookup_token?: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  customer_dni?: string | null;
  device_type: 'Celular' | 'PC de escritorio' | 'Notebook';
  service_type: 'Reparación' | 'Mantenimiento';
  brand: string | null;
  model: string | null;
  serial_imei?: string | null;
  problem_description: string;
  diagnosis: string | null;
  estimated_price: number | null;
  internal_notes: string | null;
  public_notes?: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  status: ServiceRequestStatus;
  created_at: string;
  updated_at?: string;
}

export interface ServiceRequestEvent {
  id: string;
  service_request_id: string;
  previous_status?: string | null;
  new_status: string;
  notes?: string | null;
  actor?: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  name?: string | null;
  role?: 'superadmin' | 'admin' | 'operador';
  active?: boolean;
  last_login_at?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  bg_url: string;
  items_list: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MercadoPagoConfigData {
  publicKey: string;
  sandbox?: boolean;
  configured: boolean;
  updated_at?: string;
}

export interface AdminAuditLog {
  id: string;
  admin_username: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}
