export type UserRole = 'customer' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  is_super_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  name: string; // e.g. "Color", "Storage"
  value: string; // e.g. "Space Black", "256GB"
  price_adjustment: number;
  stock_quantity: number;
  sku?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string; // category slug or name
  category_id?: string;
  subCategory?: string;
  brandTag: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  compare_price?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  badge?: {
    text: string;
    type: 'bestseller' | 'popular' | 'essential' | 'flash' | 'aesthetic' | 'smart';
  };
  discountPercent?: number;
  inStock: boolean;
  stockCount: number;
  low_stock_threshold?: number;
  description: string;
  short_description?: string;
  features: string[];
  specs?: Record<string, string>;
  isNew?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_active?: boolean;
  variants?: ProductVariant[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  countText: string;
  image: string;
  isNew?: boolean;
  filterKey: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CartItem {
  id?: string; // database cart item id if saved
  product: Product;
  quantity: number;
  selectedColor?: string;
  variant_id?: string;
}

export interface Review {
  id: string;
  product_id?: string;
  author: string;
  location: string;
  verified: boolean;
  rating: number;
  comment: string;
  avatarInitials: string;
  productName?: string;
  is_approved?: boolean;
  created_at?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface Order {
  id: string;
  order_number?: string;
  user_id?: string;
  items: CartItem[];
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    district: string;
    address: string;
    notes?: string;
  };
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'card' | 'bank';
  payment_status?: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  trackingNumber: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order?: number;
  maximum_discount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

export interface CustomerProfile extends Profile {
  ordersCount?: number;
  totalSpent?: number;
  lastOrderDate?: string;
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export type AuditActionType =
  | 'order_status_update'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'inventory_update'
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'coupon_create'
  | 'coupon_update'
  | 'coupon_delete'
  | 'role_change'
  | 'admin_login'
  | 'admin_logout';

export type AuditTargetType =
  | 'order'
  | 'product'
  | 'inventory'
  | 'category'
  | 'coupon'
  | 'customer'
  | 'role'
  | 'auth';

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name?: string;
  is_super_admin: boolean;
  action: AuditActionType;
  target_type: AuditTargetType;
  target_id: string;
  description: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}
