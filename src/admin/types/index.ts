export type Permission = 
  | 'manage_users'   // إدارة المستخدمين
  | 'view_shifts'    // عرض الورديات
  | 'manage_shifts'  // إدارة الورديات
  | 'view_debts'     // عرض الديون
  | 'manage_debts'   // إدارة الديون
  | 'view_inventory' // عرض المخزون
  | 'manage_inventory'; // إدارة المخزون

export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role: Role;
  permissions: Permission[];
}
