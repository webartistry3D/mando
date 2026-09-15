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
