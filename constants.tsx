
import { UserRole, User } from './types';

export const CURRENCY = '৳';

export const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  username: 'Admin',
  password: '123456',
  role: UserRole.ADMIN,
  fullName: 'Master Administrator',
  permissions: {
    canAddInventory: true,
    accessiblePages: ['dashboard', 'inventory', 'sales', 'reports', 'users', 'settings', 'audit-logs']
  }
};

export const STORAGE_KEYS = {
  USERS: 'visiontrack_users',
  PRODUCTS: 'visiontrack_products',
  SALES: 'visiontrack_sales',
  CURRENT_USER: 'visiontrack_auth',
  APP_CONFIG: 'visiontrack_config',
  AUDIT_LOGS: 'visiontrack_logs'
};

export const PRODUCT_TYPES = ['Frame', 'Lens', 'Sunglasses', 'Contact Lens', 'Accessory'];

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
  { id: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked' },
  { id: 'sales', label: 'Sales & Billing', icon: 'fa-cash-register' },
  { id: 'reports', label: 'Reports', icon: 'fa-file-lines' },
  { id: 'users', label: 'Employees', icon: 'fa-users', adminOnly: true },
  { id: 'audit-logs', label: 'Audit Logs', icon: 'fa-shield-halved', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'fa-cog' },
];
