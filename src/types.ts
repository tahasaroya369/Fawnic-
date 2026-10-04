export type UserRole = 'customer' | 'admin' | 'staff';

export interface StaffActionPermissions {
  products?: {
    view?: boolean;
    add?: boolean;
    create?: boolean;
    edit?: boolean;
    publish?: boolean;
    unpublish?: boolean;
    delete?: boolean;
    change_price?: boolean;
    [key: string]: any;
  };
  orders?: {
    view?: boolean;
    edit?: boolean;
    cancel?: boolean;
    delete?: boolean;
    change_status?: boolean;
    refund?: boolean;
    [key: string]: any;
  };
  invoices?: {
    view?: boolean;
    create?: boolean;
    create_manual?: boolean;
    edit?: boolean;
    download?: boolean;
    delete?: boolean;
    [key: string]: any;
  };
  staff?: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    manage_permissions?: boolean;
    change_password?: boolean;
    [key: string]: any;
  };
  queries?: {
    view?: boolean;
    reply?: boolean;
    change_status?: boolean;
    change_priority?: boolean;
    internal_notes?: boolean;
    archive?: boolean;
    delete?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface StaffPermissions {
  pages: string[];
  actions?: Partial<StaffActionPermissions>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  adminRole?: string;
  staffRole?: string;
  permissions?: StaffPermissions;
  avatar?: string;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  banner: string;
  description: string;
  featured: boolean;
  image?: string;
  subcategories: string[];
  isActive?: boolean;
  order?: number;
}

export interface Vendor {
  id: string;
  name: string;
  slug?: string;
  tagline: string;
  description: string;
  category: string;
  logo: string;
  banner: string;
  rating: number;
  reviewCount: number;
  productsCount: number;
  badge?: string;
  verified: boolean;
  origin?: string;
}

export interface ProductVariantOption {
  label: string;
  priceDelta?: number;
  stock?: number;
  sku?: string;
}

export interface ProductVariation {
  id: string;
  name: string; // e.g. "Black", "Brown", "34", "Black / 34"
  type?: 'color' | 'size' | 'combination';
  color?: string; // e.g. "Black"
  size?: string; // e.g. "34", "Large"
  image?: string; // separate image URL or uploaded file
  colorCode?: string; // optional color swatch hex/css (e.g. "#1c1917")
  sku?: string; // optional variation-specific SKU or suffix
  price?: number; // variation-specific selling price (Rs.)
  regularPrice?: number; // optional variation regular price
  stock?: number; // optional variation-specific stock count
  order?: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Color", "Waist Size", "Leather Type"
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brand: string;
  leatherType?: string; // e.g. "Full-Grain Italian Cowhide", "Vegetable Tanned Leather", "Top-Grain Nappa"
  sku: string;
  regularPrice: number;
  salePrice: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  mainImage: string;
  images: string[];
  tags: string[];
  variants: ProductVariant[];
  hasVariations?: boolean;
  variations?: ProductVariation[];
  colorVariations?: ProductVariation[];
  sizeVariations?: ProductVariation[];
  features: string[];
  specifications: Record<string, string>;
  careInstructions?: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  status: 'published' | 'draft' | 'archived';
  vendorStoreName?: string;
  vendorId?: string;
  isFlashDeal?: boolean;
  categorySlug?: string;
  subcategory?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>; // e.g. { "Color": "Cognac Brown", "Size": "34" }
  selectedVariation?: ProductVariation;
  selectedColor?: string;
  selectedSize?: string;
  unitPrice: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  name?: string;
  image?: string;
  sku?: string;
  variantInfo?: string;
  selectedVariation?: ProductVariation;
  quantity: number;
  unitPrice: number;
  price?: number;
  total?: number;
  id?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariants?: Record<string, string>;
  discount?: number;
  subtotal: number;
}

export type OrderStatus =
  | 'new'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'ready_to_dispatch'
  | 'dispatched'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export interface Address {
  id: string;
  userId?: string;
  label?: 'Home' | 'Office' | 'Other' | string;
  fullName?: string;
  recipientName?: string;
  phone: string;
  province: string;
  city: string;
  area?: string;
  addressLine1?: string;
  addressLine2?: string;
  streetAddress?: string;
  houseNumber?: string;
  postalCode: string;
  landmark?: string;
  isDefault: boolean;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
  location?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  discountAmount?: number;
  vendorSubOrders?: any[];
  couponCode?: string;
  total: number;
  cashbackPercentage?: number;
  cashbackAmount?: number;
  cashbackStatus?: string;
  paymentMethod: 'cod' | 'bank_transfer' | string;
  paymentStatus: 'pending' | 'pending_verification' | 'paid' | 'failed' | 'refunded' | 'rejected';
  paymentProof?: string;
  paymentProofUrl?: string;
  paymentProofSubmittedAt?: string;
  bankTxRef?: string;
  transactionReference?: string;
  transactionId?: string;
  bankSenderName?: string;
  paymentVerificationStatus?: 'unverified' | 'pending_verification' | 'verified' | 'rejected' | string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  paymentRejectionReason?: string;
  paymentVerificationNotes?: string;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  courier?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  expectedDelivery?: string;
  estimatedDelivery?: string;
  notes?: string;
  internalNotes?: string;
  timeline?: OrderTimelineItem[];
  trackingHistory?: OrderTimelineItem[];
  returnReason?: string;
  returnDetails?: string;
  returnRequested?: boolean;
  returnStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'refunded';
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  customerId?: string;
  customerName: string;
  userName?: string;
  customerCity?: string;
  customerAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verifiedPurchase: boolean;
  isVerifiedPurchase?: boolean;
  isApproved: boolean;
  createdAt: string;
  adminReply?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'percentage' | 'fixed_amount';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  expiresAt: string;
  expiryDate?: string;
  isActive: boolean;
}

export type NotificationType =
  | 'General'
  | 'Customer Service'
  | 'New Arrival'
  | 'Winter Sale'
  | 'Summer Sale'
  | 'Discount'
  | 'Promotion'
  | 'Flash Sale'
  | 'Order Update'
  | 'Shipping Update'
  | 'Announcement'
  | 'Stock Alert'
  | 'Website Update';

export type NotificationAudience = 'all' | 'registered' | 'specific' | 'admin';
export type NotificationStatus = 'draft' | 'published' | 'scheduled' | 'expired';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  image?: string;
  link?: string;
  buttonText?: string;
  audience: NotificationAudience;
  targetUserIds?: string[];
  targetUserNames?: string[];
  status: NotificationStatus;
  scheduledAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
  readCount?: number;
}

export interface NotificationReadState {
  id: string;
  userId: string;
  notificationId: string;
  readAt: string;
}

export interface NotificationItem extends NotificationRecord {
  userId?: string;
  isRead?: boolean;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  category: 'Orders' | 'Shipping' | 'Leather Care' | 'Returns & Warranty' | 'Payments' | 'General';
  question: string;
  answer: string;
  order: number;
}

export interface Policy {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface HomepageCMS {
  heroHeading: string;
  heroSubheading: string;
  heroImage: string;
  heroCtaText: string;
  heroCtaLink: string;
  announcementText: string;
  isAnnouncementEnabled: boolean;
  featuredCategoriesEnabled: boolean;
  bestSellersEnabled: boolean;
  brandStoryEnabled: boolean;
  craftsmanshipEnabled: boolean;
  featuredWalletEnabled: boolean;
  beltShowcaseEnabled: boolean;
  whyFawnicEnabled: boolean;
  reviewsEnabled: boolean;
  brandGalleryEnabled: boolean;
  newsletterEnabled: boolean;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  faviconUrl: string;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp: string;
  officeAddress: string;
  standardShippingFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryKarachi: string;
  estimatedDeliveryMajorCities: string;
  estimatedDeliveryNationwide: string;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankName: string;
  bankIban: string;
  bankBranch?: string;
  bankBranchCode?: string;
  bankPaymentInstructions?: string;
  bankPaymentProofRequired?: boolean;
  ntnNumber?: string;
}

export type AdminRole =
  | 'super_admin'
  | 'manager'
  | 'order_manager'
  | 'catalog_manager'
  | 'accountant'
  | 'support';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  status: 'active' | 'disabled' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  permissions: StaffPermissions;
  passwordHash?: string;
  salt?: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  change: number;
  previousStock: number;
  newStock: number;
  changeAmount?: number;
  performedByName?: string;
  reason:
    | 'Purchase'
    | 'Production'
    | 'Manual Adjustment'
    | 'Damaged'
    | 'Returned'
    | 'Correction'
    | 'Order Placed'
    | 'Order Cancelled';
  referenceId?: string;
  adminEmail: string;
  timestamp: string;
  notes?: string;
}

export interface InvoiceSettings {
  businessName: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  ntn: string;
  invoicePrefix: string;
  footerText: string;
  termsAndConditions: string;
}

export type InventoryReason =
  | 'Purchase'
  | 'Production'
  | 'Manual Adjustment'
  | 'Damaged'
  | 'Returned'
  | 'Correction'
  | 'Order Placed'
  | 'Order Cancelled'
  | 'restock'
  | 'damage'
  | 'sale'
  | 'manual_audit'
  | 'return'
  | 'other';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items?: OrderItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  status: 'issued' | 'paid' | 'cancelled';
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  type?: 'order' | 'manual';
  orderId?: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax?: number;
  taxType?: 'none' | 'percentage' | 'fixed';
  taxRate?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  createdAt: string;
  status: 'issued' | 'paid' | 'cancelled';
  notes?: string;
}

export interface MarketingPromotion {
  id: string;
  title: string;
  type: 'banner' | 'popup' | 'sale' | 'email';
  description: string;
  code?: string;
  discountPercentage?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerCRM {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'vip';
  addresses: Address[];
  orders?: Order[];
  notes?: string;
  createdAt: string;
}

export type DateRange = 'today' | '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';

export type QueryCategory =
  | 'General Question'
  | 'Order'
  | 'Product'
  | 'Shipping'
  | 'Payment'
  | 'Return / Exchange'
  | 'Complaint'
  | 'Wholesale'
  | 'Other';

export type QueryStatus =
  | 'new'
  | 'in_progress'
  | 'waiting_customer'
  | 'replied'
  | 'resolved'
  | 'closed';

export type QueryPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface QueryMessage {
  id: string;
  queryId: string;
  senderId?: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'staff';
  message: string;
  createdAt: string;
  isRead?: boolean;
}

export interface QueryInternalNote {
  id: string;
  queryId: string;
  adminId: string;
  adminName: string;
  note: string;
  createdAt: string;
}

export interface QueryAuditLog {
  id: string;
  queryId: string;
  action: string;
  actorName: string;
  actorRole: 'customer' | 'admin' | 'staff' | 'system';
  timestamp: string;
  details?: string;
}

export interface CustomerQuery {
  id: string;
  queryNumber: string; // e.g. FW-QRY-0001
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  category: QueryCategory;
  orderNumber?: string;
  message: string;
  status: QueryStatus;
  priority: QueryPriority;
  isReadByAdmin: boolean;
  isReadByCustomer: boolean;
  isArchived: boolean;
  isDeleted?: boolean;
  messages: QueryMessage[];
  internalNotes?: QueryInternalNote[];
  auditTimeline: QueryAuditLog[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CustomerQueryStats {
  total: number;
  new: number;
  inProgress: number;
  waitingCustomer: number;
  replied: number;
  resolved: number;
  closed: number;
  unread: number;
  archived: number;
}

