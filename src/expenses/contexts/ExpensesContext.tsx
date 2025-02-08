import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { validateExpense, validatePaymentAmount } from '../validators';
import { Expense, Payment, ExpenseCategory, Addition } from '../types';
import { encryptSensitiveFields, decryptSensitiveFields } from '../../lib/encryption';

// الحقول الحساسة التي نريد تشفيرها
const SENSITIVE_FIELDS = ['amount', 'remainingAmount', 'notes'] as const;

interface ExpensesContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'payments' | 'remainingAmount' | 'createdBy'>) => { success: boolean; errors: string[] };
  updateExpense: (id: string, expense: Partial<Expense>) => { success: boolean; errors: string[] };
  deleteExpense: (id: string) => void;
  addPayment: (expenseId: string, payment: Omit<Payment, 'id' | 'date'> & { date: string }) => { success: boolean; errors: string[] };
  addNewLoanToExisting: (expenseId: string, newAmount: number, notes?: string) => { success: boolean; errors: string[] };
  refreshExpenses: () => void;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (!savedExpenses) return [];
    
    try {
      const parsedExpenses = JSON.parse(savedExpenses) as Expense[];
      // فك تشفير البيانات المخزنة
      return parsedExpenses.map(expense => 
        decryptSensitiveFields(expense, SENSITIVE_FIELDS)
      );
    } catch (error) {
      console.error('خطأ في قراءة البيانات المخزنة:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      // تشفير البيانات قبل التخزين
      const encryptedExpenses = expenses.map(expense => 
        encryptSensitiveFields(expense, SENSITIVE_FIELDS)
      );
      localStorage.setItem('expenses', JSON.stringify(encryptedExpenses));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    }
  }, [expenses]);

  const addExpense = (expenseData: Omit<Expense, 'id' | 'payments' | 'remainingAmount' | 'createdBy'>) => {
    const validation = validateExpense(expenseData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      payments: [],
      remainingAmount: expenseData.amount,
    };

    setExpenses(prev => [...prev, newExpense]);
    return { success: true, errors: [] };
  };

  const updateExpense = (id: string, expenseUpdate: Partial<Expense>) => {
    const validation = validateExpense(expenseUpdate);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    let updateSuccess = false;
    setExpenses(prev => prev.map(expense => {
      if (expense.id === id) {
        updateSuccess = true;
        const updatedExpense = { ...expense, ...expenseUpdate };
        if (expenseUpdate.amount !== undefined) {
          const totalPaid = expense.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
          updatedExpense.remainingAmount = expenseUpdate.amount - totalPaid;
        }
        return updatedExpense;
      }
      return expense;
    }));

    return { success: updateSuccess, errors: updateSuccess ? [] : ['لم يتم العثور على المصروف'] };
  };

  const addPayment = (expenseId: string, payment: Omit<Payment, 'id' | 'date'> & { date: string }) => {
    let expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, errors: ['لم يتم العثور على المصروف'] };
    }

    // حساب المبلغ المتبقي الحقيقي باستخدام إجمالي المبلغ (الأساسي + الإضافات)
    const totalAmount = calculateTotalLoanAmount(expense);
    const totalPaid = expense.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const actualRemainingAmount = totalAmount - totalPaid;

    const validation = validatePaymentAmount(payment.amount, actualRemainingAmount);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // إضافة الدفعة مع استخدام التاريخ المرسل
    const newPayment: Payment = {
      ...payment,
      id: uuidv4(),
      date: payment.date,
    };

    setExpenses(prev => prev.map(expense => {
      if (expense.id === expenseId) {
        const payments = [...(expense.payments || []), newPayment];
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalAmount = calculateTotalLoanAmount(expense);
        return {
          ...expense,
          payments,
          remainingAmount: totalAmount - totalPaid
        };
      }
      return expense;
    }));

    const remainingCash = localStorage.getItem('remainingCash');
    if (remainingCash) {
      const currentCash = parseFloat(remainingCash);
      localStorage.setItem('remainingCash', (currentCash + payment.amount).toString());
    }

    return { success: true, errors: [] };
  };

  // حساب إجمالي مبلغ السلفة (المبلغ الأساسي + الإضافات)
  const calculateTotalLoanAmount = (expense: Expense) => {
    const additionsTotal = expense.additions?.reduce((sum, addition) => sum + addition.amount, 0) || 0;
    return expense.amount + additionsTotal;
  };

  const addNewLoanToExisting = (expenseId: string, newAmount: number, notes?: string) => {
    if (newAmount <= 0) {
      return { success: false, errors: ['يجب أن يكون المبلغ أكبر من صفر'] };
    }

    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      return { success: false, errors: ['لم يتم العثور على السلفة'] };
    }

    if (expense.category !== 'سلف من المحل') {
      return { success: false, errors: ['هذا المصروف ليس سلفة'] };
    }

    setExpenses(prev => prev.map(expense => {
      if (expense.id === expenseId) {
        const addition: Addition = {
          date: new Date().toISOString(),
          amount: newAmount,
          notes: notes || `إضافة مبلغ ${newAmount} على السلفة`
        };

        const updatedExpense = {
          ...expense,
          additions: [...(expense.additions || []), addition],
          notes: notes || expense.notes,
        };

        const totalAmount = calculateTotalLoanAmount(updatedExpense);
        const totalPayments = updatedExpense.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        
        return {
          ...updatedExpense,
          remainingAmount: totalAmount - totalPayments
        };
      }
      return expense;
    }));

    return { success: true, errors: [] };
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => {
      const expense = prev.find(e => e.id === id);
      if (expense) {
        const remainingCash = localStorage.getItem('remainingCash');
        if (remainingCash) {
          const currentCash = parseFloat(remainingCash);
          localStorage.setItem('remainingCash', (currentCash + expense.amount).toString());
        }
      }
      return prev.filter(expense => expense.id !== id);
    });
  };

  const refreshExpenses = () => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      try {
        const parsedExpenses = JSON.parse(savedExpenses) as Expense[];
        setExpenses(parsedExpenses.map(expense => 
          decryptSensitiveFields(expense, SENSITIVE_FIELDS)
        ));
      } catch (error) {
        console.error('خطأ في قراءة البيانات المخزنة:', error);
      }
    }
  };

  return (
    <ExpensesContext.Provider value={{
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      addPayment,
      addNewLoanToExisting,
      refreshExpenses
    }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}
