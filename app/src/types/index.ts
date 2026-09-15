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
