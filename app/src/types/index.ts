export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface Business {
  id: string;
  name: string;
}

export interface Membership {
  id: string;
  businessId: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  business: Business;
}

export interface AuthData {
  token: string;
  user: User;
  business?: Business;
}

export interface MeResponse {
  user: User;
  memberships: Membership[];
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  sku?: string | null;
  description?: string | null;
  sellingPrice: number;
  costPrice: number;
  unit?: string | null;
  taxEnabled: boolean;
  inventoryTracking: boolean;
  openingStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stock?: number;
}

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdById?: string | null;
  createdAt: string;
  product?: { id: string; name: string; sku?: string | null };
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  customerType?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateItem {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal?: number;
}

export interface Estimate {
  id: string;
  businessId: string;
  customerId: string;
  number: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  issueDate: string;
  expiryDate?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: EstimateItem[];
  invoices?: Invoice[];
}

export interface InvoiceItem {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal?: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerId?: string | null;
  estimateId?: string | null;
  number: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
  paymentInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  items?: InvoiceItem[];
  payments?: Payment[];
  deliveries?: Delivery[];
}

export interface Payment {
  id: string;
  businessId: string;
  invoiceId?: string | null;
  customerId?: string | null;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'POS' | 'CASH' | 'CARD' | 'OTHER';
  paymentDate: string;
  reference?: string | null;
  description?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  invoice?: { id: string; number: string; total: number; status: string; balanceDue: number };
  customer?: { id: string; name: string; phone?: string | null; email?: string | null };
}

export interface Delivery {
  id: string;
  businessId: string;
  invoiceId?: string | null;
  customerId?: string | null;
  number: string;
  deliveryAddress?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryFee: number;
  assignedPerson?: string | null;
  trackingReference?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  notes?: string | null;
  deliveredAt?: string | null;
  recipientConfirmation?: string | null;
  proofPhotoAttachmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: DeliveryItem[];
  invoice?: { id: string; number: string; total: number };
  customer?: { id: string; name: string; phone?: string | null };
}

export interface DeliveryItem {
  id?: string;
  productId?: string | null;
  description: string;
  quantity: number;
}
