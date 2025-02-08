import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// تعريف الأنواع محلياً
interface Debt {
  id: string;
  title: string;
  amount: number;
  date: string;
  notes: string;
  paid: number;
  remaining: number;
  variant?: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  notes: string;
}

interface CreateDebtData {
  title: string;
  amount: number;
  notes?: string;
  variant?: string;
}

interface UpdateDebtData {
  title?: string;
  amount?: number;
  notes?: string;
  variant?: string;
}

interface AddPaymentData {
  amount: number;
  notes?: string;
}

interface DebtsContextType {
  debts: Debt[];
  loading: boolean;
  error: Error | null;
  addDebt: (data: CreateDebtData) => Promise<void>;
  updateDebt: (id: string, data: UpdateDebtData) => Promise<void>;
  addPayment: (debtId: string, data: AddPaymentData) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  closeDebt: (id: string) => Promise<void>;
  totalDebts: number;
  totalPaidDebts: number;
}

const DebtsContext = createContext<DebtsContextType | undefined>(undefined);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const addDebt = useCallback(async (data: CreateDebtData) => {
    const newDebt: Debt = {
      id: uuidv4(),
      title: data.title,
      amount: data.amount,
      date: new Date().toISOString(),
      notes: data.notes || '',
      paid: 0,
      remaining: data.amount,
      variant: data.variant || 'default',
      payments: []
    };

    setDebts(prev => [...prev, newDebt]);
    toast.success('تم إضافة الدين بنجاح');
  }, []);

  const updateDebt = useCallback(async (id: string, data: UpdateDebtData) => {
    setDebts(prev => prev.map(debt => {
      if (debt.id === id) {
        const amountDiff = (data.amount || debt.amount) - debt.amount;
        return {
          ...debt,
          ...data,
          remaining: debt.remaining + amountDiff
        };
      }
      return debt;
    }));
    toast.success('تم تحديث الدين بنجاح');
  }, []);

  const addPayment = useCallback(async (debtId: string, data: AddPaymentData) => {
    setDebts(prev => prev.map(debt => {
      if (debt.id === debtId) {
        const newPayment = {
          id: uuidv4(),
          amount: data.amount,
          date: new Date().toISOString(),
          notes: data.notes || ''
        };
        return {
          ...debt,
          paid: debt.paid + data.amount,
          remaining: debt.remaining - data.amount,
          payments: [...debt.payments, newPayment]
        };
      }
      return debt;
    }));
    toast.success('تم إضافة الدفعة بنجاح');
  }, []);

  const deleteDebt = useCallback(async (id: string) => {
    setDebts(prev => prev.filter(debt => debt.id !== id));
    toast.success('تم حذف الدين بنجاح');
  }, []);

  const closeDebt = useCallback(async (id: string) => {
    setDebts(prev => prev.map(debt => {
      if (debt.id === id) {
        return {
          ...debt,
          remaining: 0,
          paid: debt.amount
        };
      }
      return debt;
    }));
    toast.success('تم إغلاق الدين بنجاح');
  }, []);

  const totalDebts = debts.reduce((acc, debt) => acc + debt.amount, 0);
  const totalPaidDebts = debts.reduce((acc, debt) => acc + debt.paid, 0);

  const value = {
    debts,
    loading,
    error,
    addDebt,
    updateDebt,
    addPayment,
    deleteDebt,
    closeDebt,
    totalDebts,
    totalPaidDebts
  };

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
}

export function useDebts() {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error('useDebts must be used within a DebtsProvider');
  }
  return context;
}
