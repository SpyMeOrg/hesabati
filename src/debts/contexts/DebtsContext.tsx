import { createContext, useCallback, useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  Debt, 
  AddDebtData, 
  UpdateDebtData, 
  Payment, 
  AddPaymentData,
  DebtsContextType 
} from '../types'
import { SecureStorageService } from '../../lib/secure-storage'
import { debounce } from '../../lib/performance'
import { useExpenses } from '../../expenses/contexts/ExpensesContext'

export const DebtsContext = createContext<DebtsContextType | null>(null)

export function useDebts() {
  const context = useContext(DebtsContext)
  if (!context) {
    throw new Error('useDebts must be used within a DebtsProvider')
  }
  return context
}

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  // استخدام التخزين المشفر
  const secureStorage = SecureStorageService.getInstance();
  
  const [debts, setDebts] = useState<Debt[]>(() => {
    return secureStorage.getItem<Debt[]>("debts", []);
  });

  // استخدام debounce لتحسين الأداء عند الحفظ
  const saveToStorage = useCallback((newDebts: Debt[]) => {
    if (secureStorage.setItem("debts", newDebts)) {
      setDebts(newDebts);
    } else {
      // toast.error("حدث خطأ أثناء حفظ البيانات");
    }
  }, []);

  // تأخير عملية الحفظ لتحسين الأداء
  const debouncedSave = useCallback(
    debounce((newDebts: Debt[]) => saveToStorage(newDebts), 500),
    [saveToStorage]
  );

  // إضافة دين جديد
  const addDebt = useCallback(async (data: AddDebtData): Promise<Debt> => {
    // const validation = DebtValidation.validateDebt(data);
    // if (!validation.isValid) {
    //   throw new Error(Object.values(validation.errors)[0]);
    // }

    const newDebt: Debt = {
      id: uuidv4(),
      ...data,
      status: "pending",
      payments: [],
      remainingAmount: data.amount || 0,
      createdAt: data.debtDate,
      updatedAt: new Date().toISOString(),
    };

    const newDebts = [...debts, newDebt];
    debouncedSave(newDebts);
    return newDebt;
  }, [debts, debouncedSave]);

  // تحديث دين
  const updateDebt = useCallback(async (id: string, data: UpdateDebtData): Promise<void> => {
    const debtIndex = debts.findIndex(d => d.id === id);
    if (debtIndex === -1) {
      throw new Error("الدين غير موجود");
    }

    const currentDebt = debts[debtIndex];
    
    // تحديث البيانات الأساسية فقط
    const updatedDebt = {
      ...currentDebt,
      debtorName: data.debtorName ?? currentDebt.debtorName,
      phoneNumber: data.phoneNumber ?? currentDebt.phoneNumber,
      amount: data.amount ?? currentDebt.amount,
      dueDate: data.dueDate ?? currentDebt.dueDate,
      updatedAt: new Date().toISOString(),
      // نحافظ على باقي البيانات كما هي
      remainingAmount: data.amount ?? currentDebt.amount, // المتبقي يساوي المبلغ الجديد
      status: currentDebt.status, // لا نغير الحالة
      payments: currentDebt.payments, // لا نغير المدفوعات
    };

    const newDebts = [...debts];
    newDebts[debtIndex] = updatedDebt;
    debouncedSave(newDebts);
  }, [debts, debouncedSave]);

  const { addExpense } = useExpenses();

  // إضافة دفعة
  const addPayment = useCallback(async (data: AddPaymentData): Promise<Payment> => {
    const payment: Payment = {
      id: uuidv4(),
      debtId: data.debtId,
      amount: data.amount,
      notes: data.notes,
      paymentDate: data.paymentDate,
      createdAt: new Date().toISOString(),
      receiptImage: data.receiptImage
    }

    let updatedDebts: Debt[] = []
    
    setDebts((prevDebts) => {
      updatedDebts = prevDebts.map((debt) => {
        if (debt.id === data.debtId) {
          const newRemainingAmount = debt.remainingAmount - data.amount
          return {
            ...debt,
            remainingAmount: newRemainingAmount,
            status: newRemainingAmount <= 0 ? "paid" : "partially_paid",
            payments: [...(debt.payments || []), payment],
            updatedAt: new Date().toISOString()
          }
        }
        return debt
      })
      return updatedDebts
    })

    // حفظ البيانات مباشرة في التخزين
    try {
      await Promise.resolve() // انتظار تحديث state
      if (!secureStorage.setItem("debts", updatedDebts)) {
        throw new Error("فشل في حفظ البيانات")
      }
    } catch (error) {
      console.error("خطأ في حفظ الدفعة:", error)
      // إعادة الحالة إلى ما كانت عليه
      const originalDebts = secureStorage.getItem<Debt[]>("debts", [])
      setDebts(originalDebts)
      throw new Error("حدث خطأ أثناء حفظ الدفعة")
    }

    return payment
  }, [secureStorage])

  // حذف دين
  const deleteDebt = useCallback(async (id: string) => {
    try {
      const debtIndex = debts.findIndex(d => d.id === id)
      if (debtIndex === -1) {
        throw new Error("الدين غير موجود")
      }

      const newDebts = debts.filter(d => d.id !== id)
      
      // حفظ البيانات في التخزين أولاً
      if (!secureStorage.setItem("debts", newDebts)) {
        throw new Error("فشل في حفظ البيانات")
      }

      // تحديث الحالة بعد نجاح الحفظ
      setDebts(newDebts)
    } catch (error) {
      console.error("خطأ في حذف الدين:", error)
      throw error
    }
  }, [debts, secureStorage])

  // الحصول على دين بواسطة المعرف
  const getDebtById = useCallback((id: string): Debt | undefined => {
    return debts.find(d => d.id === id);
  }, [debts]);

  // تحديث البيانات
  const refreshDebts = useCallback(() => {
    const storedDebts = secureStorage.getItem<Debt[]>("debts", []);
    setDebts(storedDebts);
  }, []);

  return (
    <DebtsContext.Provider
      value={{
        debts,
        addDebt,
        updateDebt,
        deleteDebt,
        addPayment,
        getDebtById,
        refreshDebts,
      }}
    >
      {children}
    </DebtsContext.Provider>
  );
}
