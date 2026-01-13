
import { STORAGE_KEYS, DEFAULT_ADMIN } from '../constants';
import { User, Product, Sale, AppConfig, AuditLog, AuditActionType } from '../types';
import { db, dbRef } from './firebase';
import { set, get } from 'firebase/database';

// Helper to push to Firebase
const syncToFirebase = async (key: string, data: any) => {
  await set(dbRef(key), data);
};

export const getStoredUsers = async (): Promise<User[]> => {
  const snapshot = await get(dbRef(STORAGE_KEYS.USERS));
  if (!snapshot.exists()) {
    const initialUsers = [DEFAULT_ADMIN];
    await syncToFirebase(STORAGE_KEYS.USERS, initialUsers);
    return initialUsers;
  }
  return snapshot.val();
};

export const saveUsers = (users: User[]) => {
  syncToFirebase(STORAGE_KEYS.USERS, users);
};

export const getStoredProducts = async (): Promise<Product[]> => {
  const snapshot = await get(dbRef(STORAGE_KEYS.PRODUCTS));
  return snapshot.exists() ? snapshot.val() : [];
};

export const saveProducts = (products: Product[]) => {
  syncToFirebase(STORAGE_KEYS.PRODUCTS, products);
};

export const getStoredSales = async (): Promise<Sale[]> => {
  const snapshot = await get(dbRef(STORAGE_KEYS.SALES));
  return snapshot.exists() ? snapshot.val() : [];
};

export const saveSales = (sales: Sale[]) => {
  syncToFirebase(STORAGE_KEYS.SALES, sales);
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const getAppConfig = async (): Promise<AppConfig> => {
  const snapshot = await get(dbRef(STORAGE_KEYS.APP_CONFIG));
  return snapshot.exists() ? snapshot.val() : { enableProductImages: true, enableGeminiInsights: true };
};

export const saveAppConfig = (config: AppConfig) => {
  syncToFirebase(STORAGE_KEYS.APP_CONFIG, config);
};

// Audit Logs
export const getStoredAuditLogs = async (): Promise<AuditLog[]> => {
  const snapshot = await get(dbRef(STORAGE_KEYS.AUDIT_LOGS));
  return snapshot.exists() ? snapshot.val() : [];
};

export const addAuditLog = async (user: User, action: AuditActionType, entity: AuditLog['entity'], details: string) => {
  const logs = await getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.fullName,
    action,
    entity,
    details
  };
  const updatedLogs = [newLog, ...logs].slice(0, 500); // Keep last 500 logs
  await syncToFirebase(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
};

export const clearBusinessData = async () => {
  await Promise.all([
    syncToFirebase(STORAGE_KEYS.PRODUCTS, []),
    syncToFirebase(STORAGE_KEYS.SALES, []),
    syncToFirebase(STORAGE_KEYS.AUDIT_LOGS, [])
  ]);
};
