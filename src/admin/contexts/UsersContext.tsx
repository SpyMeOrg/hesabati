import { createContext, useContext, useState, useCallback } from "react";
import { User, CreateUserData, UpdateUserData, DEFAULT_PERMISSIONS } from "../types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface UsersContextType {
  users: User[];
  addUser: (data: CreateUserData) => Promise<void>;
  updateUser: (userId: string, data: UpdateUserData) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("users");
    if (savedUsers) {
      return JSON.parse(savedUsers);
    }

    // إنشاء مستخدم افتراضي إذا لم يكن هناك مستخدمين
    const defaultAdmin: User = {
      id: uuidv4(),
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      permissions: DEFAULT_PERMISSIONS.admin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // حفظ كلمة المرور الافتراضية
    localStorage.setItem(`password_${defaultAdmin.id}`, "admin123");
    localStorage.setItem("users", JSON.stringify([defaultAdmin]));

    return [defaultAdmin];
  });

  // حفظ المستخدمين في التخزين المحلي
  const saveUsers = useCallback((newUsers: User[]) => {
    localStorage.setItem("users", JSON.stringify(newUsers));
    setUsers(newUsers);
  }, []);

  // إضافة مستخدم جديد
  const addUser = useCallback(async (data: CreateUserData) => {
    const existingUser = users.find(
      (u) => u.email === data.email || u.username === data.username
    );

    if (existingUser) {
      throw new Error("المستخدم موجود بالفعل");
    }

    const newUser: User = {
      id: uuidv4(),
      ...data,
      permissions: data.permissions.length > 0 ? data.permissions : DEFAULT_PERMISSIONS[data.role],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // حفظ كلمة المرور
    if (data.password) {
      localStorage.setItem(`password_${newUser.id}`, data.password);
    }

    saveUsers([...users, newUser]);
    toast.success("تم إضافة المستخدم بنجاح");
  }, [users, saveUsers]);

  // تحديث مستخدم
  const updateUser = useCallback(async (userId: string, data: UpdateUserData) => {
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("المستخدم غير موجود");
    }

    if (data.email || data.username) {
      const existingUser = users.find(
        (u) => u.id !== userId && (
          (data.email && u.email === data.email) ||
          (data.username && u.username === data.username)
        )
      );

      if (existingUser) {
        throw new Error("البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل");
      }
    }

    const updatedUser = {
      ...users[userIndex],
      ...data,
      permissions: data.permissions ||
        (data.role ? DEFAULT_PERMISSIONS[data.role] : users[userIndex].permissions),
      updatedAt: new Date().toISOString(),
    };

    // تحديث كلمة المرور إذا تم توفيرها
    if (data.password) {
      localStorage.setItem(`password_${userId}`, data.password);
    }

    const newUsers = [...users];
    newUsers[userIndex] = updatedUser;
    saveUsers(newUsers);
    toast.success("تم تحديث المستخدم بنجاح");
  }, [users, saveUsers]);

  // حذف مستخدم
  const deleteUser = useCallback(async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) {
      throw new Error("المستخدم غير موجود");
    }

    // التحقق من أن المستخدم ليس المسؤول الرئيسي (أول admin)
    const isMainAdmin = users.findIndex((u) => u.role === "admin") === users.findIndex((u) => u.id === userId);
    if (isMainAdmin) {
      throw new Error("لا يمكن حذف المسؤول الرئيسي");
    }

    // التحقق من أن المستخدم لا يحاول حذف نفسه
    const currentUserId = localStorage.getItem("currentUserId");
    if (userId === currentUserId) {
      throw new Error("لا يمكنك حذف حسابك الخاص");
    }

    const newUsers = users.filter((u) => u.id !== userId);
    saveUsers(newUsers);
    toast.success("تم حذف المستخدم بنجاح");
  }, [users, saveUsers]);

  // الحصول على مستخدم بواسطة المعرف
  const getUserById = useCallback((userId: string) => {
    return users.find((u) => u.id === userId);
  }, [users]);

  return (
    <UsersContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("يجب استخدام useUsers داخل UsersProvider");
  }
  return context;
}
