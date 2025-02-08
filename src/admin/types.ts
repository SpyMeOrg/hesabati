// أنواع الأدوار المتاحة
export type Role = "admin" | "editor" | "viewer"

// أنواع الصلاحيات المتاحة
export type Permission = 
    | "view_users" | "manage_users"
    | "view_shifts" | "manage_shifts"
    | "view_inventory" | "manage_inventory"
    | "view_debts" | "manage_debts"
    | "view_expenses" | "manage_expenses"

// مجموعات الصلاحيات
export const PERMISSION_GROUPS = {
    users: {
        title: "المستخدمين",
        permissions: ["view_users", "manage_users"] as Permission[]
    },
    shifts: {
        title: "الورديات",
        permissions: ["view_shifts", "manage_shifts"] as Permission[]
    },
    inventory: {
        title: "المخزون",
        permissions: ["view_inventory", "manage_inventory"] as Permission[]
    },
    debts: {
        title: "الديون",
        permissions: ["view_debts", "manage_debts"] as Permission[]
    },
    expenses: {
        title: "المصاريف",
        permissions: ["view_expenses", "manage_expenses"] as Permission[]
    }
} as const;

// الصلاحيات الافتراضية لكل دور
export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "manage_shifts",
    "view_shifts",
    "manage_inventory",
    "view_inventory",
    "manage_users",
    "view_users",
    "manage_debts",
    "view_debts",
    "manage_expenses",
    "view_expenses"
  ],
  editor: [
    "manage_shifts",
    "view_shifts",
    "manage_inventory",
    "view_inventory",
    "manage_debts",
    "view_debts",
    "manage_expenses",
    "view_expenses"
  ],
  viewer: [
    "view_shifts",
    "view_inventory",
    "view_debts",
    "view_expenses"
  ]
}

// ترجمة الصلاحيات
export const PERMISSION_LABELS: Record<Permission, string> = {
    view_users: "عرض المستخدمين",
    manage_users: "إدارة المستخدمين",
    view_shifts: "عرض الورديات",
    manage_shifts: "إدارة الورديات",
    view_inventory: "عرض المخزون",
    manage_inventory: "إدارة المخزون",
    view_debts: "عرض الديون",
    manage_debts: "إدارة الديون",
    view_expenses: "عرض المصاريف",
    manage_expenses: "إدارة المصاريف"
}

// ترجمة الأدوار
export const ROLE_LABELS: Record<Role, string> = {
  admin: "مدير",
  editor: "محرر",
  viewer: "مشاهد"
}

// نموذج المستخدم
export interface User {
  id: string
  username: string
  email: string
  role: Role
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

// نموذج إنشاء مستخدم جديد
export interface CreateUserData {
  username: string
  email: string
  password: string
  role: Role
  permissions: Permission[]
}

// نموذج تحديث مستخدم
export interface UpdateUserData {
  username?: string
  email?: string
  password?: string
  role?: Role
  permissions?: Permission[]
}

// نموذج تسجيل الدخول
export interface LoginData {
  email: string
  password: string
}

// نموذج المستخدم المصادق
export interface AuthUser {
  id: string
  username: string
  email: string
  role: Role
  token: string
  permissions: Permission[]
}

// نوع سياق المصادقة
export interface AuthContextType {
  user: AuthUser | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
