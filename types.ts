
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface UserPermissions {
  canAddInventory: boolean;
  accessiblePages: string[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  permissions: UserPermissions;
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  type: 'Frame' | 'Lens' | 'Sunglasses' | 'Contact Lens' | 'Accessory';
  material: string;
  color: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  description: string;
  lastUpdated: string;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  customerName: string;
  customerContact: string;
  date: string;
  salespersonId: string;
  salespersonName: string;
}

export interface AppConfig {
  enableProductImages: boolean;
  enableGeminiInsights: boolean;
}

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SYSTEM = 'SYSTEM'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditActionType;
  // Added 'SYSTEM' to the entity union to allow logging system-wide events that aren't tied to a specific data entity.
  entity: 'PRODUCT' | 'SALE' | 'USER' | 'CONFIG' | 'SYSTEM';
  details: string;
}
