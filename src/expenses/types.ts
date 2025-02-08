export type ExpenseCategory = 'سلف من المحل' | 'مصاريف تشغيلية' | 'مصاريف صيانة' | 'رواتب' | 'إيجار' | 'فواتير' | 'أخرى';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Addition {
  date: string;
  amount: number;
  notes?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  notes?: string;
  date: string;
  payments?: Payment[];
  remainingAmount?: number;
  createdBy?: string;
  additions?: Addition[];
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'سلف من المحل',
  'مصاريف تشغيلية',
  'مصاريف صيانة',
  'رواتب',
  'إيجار',
  'فواتير',
  'أخرى'
];
