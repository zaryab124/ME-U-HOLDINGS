export type UserRole = 
  | "OWNER"
  | "ADMIN"
  | "BRANCH_MANAGER"
  | "KITCHEN_MANAGER"
  | "KITCHEN_STAFF"
  | "CASHIER"
  | "RIDER"
  | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  branch_id?: string;
  is_active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  opening_time: string;
  closing_time: string;
  status: "ACTIVE" | "INACTIVE";
  delivery_enabled: boolean;
  dine_in_enabled: boolean;
  takeaway_enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  cost_price: number;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  cost_price: number;
}

export interface Product {
  id: string;
  branch_id?: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  cost_price: number;
  availability: boolean;
  preparation_time: number;
  featured: boolean;
  category?: Category;
  variants: ProductVariant[];
  addons: ProductAddon[];
}

export interface Table {
  id: string;
  branch_id: string;
  table_number: string;
  seats: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
  qr_code_token: string;
  active: boolean;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  addons_json?: any;
  item_total: number;
  item_status: string;
}

export interface OrderStatusHistory {
  id: string;
  previous_status?: string;
  new_status: string;
  changed_by_user_id?: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  branch_id: string;
  customer_id?: string;
  table_id?: string;
  rider_id?: string;
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  status: "PENDING" | "CONFIRMED" | "ACCEPTED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "COMPLETED" | "CANCELLED";
  delivery_status?: "WAITING_FOR_RIDER" | "RIDER_ASSIGNED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED";
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_notes?: string;
  special_instructions?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  preparation_time_minutes: number;
  prepared_at?: string;
  created_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export interface Deal {
  id: string;
  branch_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  discount_type: "PERCENTAGE" | "FIXED" | "BOGO" | "COMBO" | "CUSTOM";
  discount_value: number;
  minimum_order: number;
  maximum_discount?: number;
  active: boolean;
}

export interface SalesOverview {
  total_sales_today: number;
  total_sales_week: number;
  total_sales_month: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_cost: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  avg_order_value: number;
  best_branch?: string;
  best_selling_food?: string;
  worst_selling_food?: string;
  customer_count: number;
  delivery_count: number;
  dine_in_count: number;
  takeaway_count: number;
}
