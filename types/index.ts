export type Role = "CUSTOMER" | "ADMIN";
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentGateway = "RAZORPAY" | "STRIPE";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: Category | null;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
  sku: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  imageAlts: string[];
  categoryId: string;
  category?: Category;
  sizes: string[];
  colors: string[];
  fabric: string | null;
  stock: number;
  featured: boolean;
  isNewArrival: boolean;
  createdAt: Date;
  reviews?: Review[];
  variants?: ProductVariant[];
  _count?: { reviews: number };
}

export interface CartItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  size: string;
  color: string;
  price: number;
}

export interface Cart {
  id: string;
  userId: string | null;
  items: CartItem[];
}

export interface WishlistItem {
  productId: string;
  product?: Product;
  addedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  size: string;
  color: string;
  price: number;
  sku: string | null;
}

export interface Order {
  id: string;
  userId: string | null;
  guestEmail: string | null;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  trackingId: string | null;
  addressId: string;
  address?: Address;
  paymentId: string | null;
  paymentStatus: PaymentStatus;
  paymentGateway: PaymentGateway | null;
  createdAt: Date;
  user?: User | null;
}

export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface AppliedPromo {
  code: string;
  discountPercent: number;
  maxDiscount: number | null;
  discountAmount: number;
  message: string;
}

// Store types
export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  appliedPromo: AppliedPromo | null;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setPromo: (promo: AppliedPromo | null) => void;
  setItems: (items: CartItem[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export interface WishlistStore {
  items: WishlistItem[];
  addItem: (productId: string, product?: Product) => void;
  removeItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  setItems: (items: WishlistItem[]) => void;
  totalItems: () => number;
}

export interface UIStore {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  fabric?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  pageSize?: number;
  search?: string;
  featured?: boolean;
  isNewArrival?: boolean;
}

// Payment types
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface CheckoutFormData {
  address: Omit<Address, "id" | "userId" | "isDefault">;
  guestEmail?: string;
  paymentGateway: PaymentGateway;
  promoCode?: string;
}
