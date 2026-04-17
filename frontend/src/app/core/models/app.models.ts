export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_DELIVERY_BOY';
export type PaymentMethod = 'ONLINE' | 'COD';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'READY_TO_PICK' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  is_active: boolean;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MenuItem {
image_path: any;
  id: number;
  name: string;
  description?: string | null;
  price: number;
  available: boolean;
  image_url?: string | null;
}

export interface CartItem {
  menu_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

export interface OrderItem {
  id: number;
  salad_id: number;
  salad_name: string;
  quantity: number;
  price: number;
}

export interface OrderParty {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
}

export interface Order {
  id: number;
  delivery_address: string;
  total_amount: number;
  status: OrderStatus;
  order_time: string;
  delivered_at?: string | null;
  payment_method: PaymentMethod;
  customer: OrderParty;
  delivery_boy?: OrderParty | null;
  items: OrderItem[];
}

export interface DeliveryBoy extends User {}

export interface AppSettings {
  is_cod_available: boolean;
  razorpay_configured: boolean;
  razorpay_key_id?: string | null;
}

export interface DeliveryEarning {
  order_id: number;
  delivery_address: string;
  delivered_at: string;
  amount: number;
  commission: number;
}

export interface DeliveryEarningsResponse {
  total_earnings: number;
  delivery_earnings: DeliveryEarning[];
}

export interface DailyEarning {
  date: string;
  total_amount: number;
}
