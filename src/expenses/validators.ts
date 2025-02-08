import { Expense, Payment, ExpenseCategory, EXPENSE_CATEGORIES } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateExpenseAmount(amount: number): ValidationResult {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push('يجب أن يكون المبلغ أكبر من صفر');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExpenseDate(date: string): ValidationResult {
  const errors: string[] = [];
  const expenseDate = new Date(date);
  const today = new Date();
  
  // تنسيق التواريخ لمقارنة اليوم فقط
  const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (expenseDateOnly > todayOnly) {
    errors.push('لا يمكن إضافة مصروفات بتاريخ مستقبلي');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePaymentAmount(amount: number, remainingAmount: number): ValidationResult {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push('يجب أن يكون مبلغ الدفع أكبر من صفر');
  }
  
  if (amount > remainingAmount) {
    errors.push('مبلغ الدفع أكبر من المبلغ المتبقي');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExpense(expense: Partial<Expense>): ValidationResult {
  const errors: string[] = [];
  
  if (expense.amount !== undefined) {
    const amountValidation = validateExpenseAmount(expense.amount);
    errors.push(...amountValidation.errors);
  }
  
  if (expense.date !== undefined) {
    const dateValidation = validateExpenseDate(expense.date);
    errors.push(...dateValidation.errors);
  }
  
  if (!expense.name || expense.name.trim() === '') {
    errors.push('يجب إدخال اسم المصروف');
  }
  
  if (expense.category && !EXPENSE_CATEGORIES.includes(expense.category as ExpenseCategory)) {
    errors.push('فئة المصروف غير صحيحة');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
