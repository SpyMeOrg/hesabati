import React from 'react';
import { useState, useMemo } from 'react';
import { useExpenses } from '../contexts/ExpensesContext';
import { useAuth } from '../../contexts/AuthContext';
import { ExpenseCategory, EXPENSE_CATEGORIES, Expense, Payment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, startOfDay, endOfDay, startOfMonth, startOfYear, parse } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon, Pencil, Trash, ArrowDownToLine } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

// Helper functions
const calculateTotal = (expenses: Expense[]) => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

const formatDate = (date: Date | string, type = 'full') => {
  const dateObj = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date;
  return type === 'short' 
    ? format(dateObj, 'yyyy-MM-dd')
    : format(dateObj, 'PPP', { locale: ar });
};

const filterByCategory = (expenses: Expense[], category: string, exclude = false) => {
  if (category === 'الكل') return expenses;
  return expenses.filter(expense => exclude 
    ? expense.category !== category 
    : expense.category === category
  );
};

const getButtonStyle = (color: string) => 
  `h-8 w-8 text-${color}-600 hover:text-${color}-700 hover:bg-${color}-100`;

// تعريف نوع DialogProps
interface DialogProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  disabled?: boolean;
}

const DialogActions = ({ onCancel, onConfirm, confirmText = 'حفظ', disabled }: DialogProps) => (
  <DialogFooter>
    <Button variant="outline" onClick={onCancel}>إلغاء</Button>
    <Button onClick={onConfirm} disabled={disabled}>{confirmText}</Button>
  </DialogFooter>
);

// تعريف نوع DateRange
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// دالة لترتيب المصروفات من الأحدث للأقدم
const sortByDateDesc = (items: Expense[]) => {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// دالة لترتيب المعاملات حسب التاريخ والنوع
const sortTransactions = (transactions: any[]) => {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    // إذا كان نفس اليوم
    if (dateA.toDateString() === dateB.toDateString()) {
      // إذا كان نفس النوع، نحافظ على الترتيب الأصلي
      if (a.type === b.type) {
        return transactions.indexOf(a) - transactions.indexOf(b);
      }
    }
    
    // غير كده نرتب عادي حسب التاريخ
    return dateA.getTime() - dateB.getTime();
  });
};

// دالة للبحث في النص
const matchesSearch = (text: string, search: string) => {
  return text.includes(search);
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const { expenses, addExpense, updateExpense, deleteExpense, addPayment, addNewLoanToExisting } = useExpenses();
  const { user } = useAuth();
  const canManageExpenses = user?.permissions.includes("manage_expenses") || user?.role === "admin";
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showPaymentsHistory, setShowPaymentsHistory] = useState(false);

  // State للـ payments history
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDate, setRepaymentDate] = useState<Date>(new Date());
  const [repaymentNotes, setRepaymentNotes] = useState('');

  // State للتعامل مع إضافة
  const [isNewLoanDialogOpen, setIsNewLoanDialogOpen] = useState(false);
  const [newLoanAmount, setNewLoanAmount] = useState('');
  const [newLoanNotes, setNewLoanNotes] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [newLoanDate, setNewLoanDate] = useState(new Date());

  // حالة نموذج السلفة الجديدة
  const [isNewLoanFormOpen, setIsNewLoanFormOpen] = useState(false);
  const [newLoanFormData, setNewLoanFormData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [loanCounter, setLoanCounter] = useState(1);

  // دالة لاستخراج اسم الشخص من اسم السلفة
  const getPersonNameFromLoan = (loanName: string) => {
    // إذا كان الاسم يحتوي على "سلفة" نأخذ ما بعد آخر " - "
    if (loanName.includes('سلفة')) {
      const parts = loanName.split(' - ');
      return parts[parts.length - 1];
    }
    return loanName;
  };

  // حساب إجمالي المدفوعات
  const calculateTotalPayments = (payments?: Payment[]) => {
    if (!payments) return 0;
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  // حساب إجمالي مبلغ السلفة (المبلغ الأساسي + الإضافات)
  const calculateTotalLoanAmount = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل') return expense.amount;
    const additionsTotal = expense.additions?.reduce((sum, addition) => sum + addition.amount, 0) || 0;
    return expense.amount + additionsTotal;
  };

  // حساب المبلغ المتبقي
  const calculateRemainingAmount = (expense: Expense) => {
    const totalPaid = calculateTotalPayments(expense.payments);
    const totalAmount = calculateTotalLoanAmount(expense);
    return totalAmount - totalPaid;
  };

  // التحقق من إمكانية إضافة سلفة جديدة
  const canStartNewLoan = (expense: Expense) => {
    const remainingAmount = calculateRemainingAmount(expense);
    // يمكن إضافة سلفة جديدة فقط إذا تم سداد السلفة الحالية بالكامل
    return remainingAmount === 0;
  };

  // حساب إحصائيات المصروفات
  const stats = useMemo(() => {
    const today = new Date();

    // حساب إجمالي مصروفات اليوم
    const todayExpenses = expenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.date);
      if (format(expenseDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        // نضيف قيمة المصروف كاملة (سواء كان مصروف عادي أو سلفة)
        total += calculateTotalLoanAmount(expense);

        // إذا كانت سلفة، نخصم منها المدفوعات التي تمت اليوم
        if (expense.category === 'سلف من المحل' && expense.payments) {
          const todayPayments = expense.payments
            .filter(payment => format(new Date(payment.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
            .reduce((sum, payment) => sum + payment.amount, 0);
          total -= todayPayments;
        }
      }
      return total;
    }, 0);

    // حساب إجمالي مصروفات الشهر
    const monthExpenses = expenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = format(expenseDate, 'yyyy-MM');
      const currentMonth = format(today, 'yyyy-MM');
      
      if (expenseMonth === currentMonth) {
        // نضيف قيمة المصروف كاملة (سواء كان مصروف عادي أو سلفة)
        total += calculateTotalLoanAmount(expense);

        // إذا كانت سلفة، نخصم منها المدفوعات التي تمت هذا الشهر
        if (expense.category === 'سلف من المحل' && expense.payments) {
          const monthPayments = expense.payments
            .filter(payment => format(new Date(payment.date), 'yyyy-MM') === currentMonth)
            .reduce((sum, payment) => sum + payment.amount, 0);
          total -= monthPayments;
        }
      }
      return total;
    }, 0);

    // حساب إجمالي مصروفات السنة
    const yearExpenses = expenses.reduce((total, expense) => {
      const expenseDate = new Date(expense.date);
      const expenseYear = format(expenseDate, 'yyyy');
      const currentYear = format(today, 'yyyy');
      
      if (expenseYear === currentYear) {
        // نضيف قيمة المصروف كاملة (سواء كان مصروف عادي أو سلفة)
        total += calculateTotalLoanAmount(expense);

        // إذا كانت سلفة، نخصم منها المدفوعات التي تمت هذه السنة
        if (expense.category === 'سلف من المحل' && expense.payments) {
          const yearPayments = expense.payments
            .filter(payment => format(new Date(payment.date), 'yyyy') === currentYear)
            .reduce((sum, payment) => sum + payment.amount, 0);
          total -= yearPayments;
        }
      }
      return total;
    }, 0);

    return {
      daily: todayExpenses,
      monthly: monthExpenses,
      yearly: yearExpenses,
    };
  }, [expenses]);

  // فلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [dateFilter, setDateFilter] = useState('جميع المصروفات');
  // تعريف state
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);

  // نموذج
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // إضافة حالة الأخطاء
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    amount: '',
    date: '',
    category: ''
  });

  // دالة التحقق الفوري من الحقول
  const validateField = (name: string, value: any) => {
    let error = '';
    switch(name) {
      case 'name':
        if (!value?.trim()) {
          error = 'يجب إدخال اسم المصروف';
        }
        break;
      case 'amount':
        if (!value) {
          error = 'يجب إدخال المبلغ';
        } else if (parseFloat(value) <= 0) {
          error = 'المبلغ يجب أن يكون أكبر من صفر';
        }
        break;
      case 'category':
        if (!value) {
          error = 'يجب اختيار التصنيف';
        }
        break;
      case 'date':
        if (!value) {
          error = 'يجب اختيار التاريخ';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) {
            error = 'لا يمكن اختيار تاريخ مستقبلي';
          }
        }
        break;
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // دالة إغلاق نموذج الإضافة/التعديل
  const handleCloseDialog = () => {
    setIsExpenseDialogOpen(false);
    setFormData({
      name: '',
      amount: '',
      category: '',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setFieldErrors({ name: '', amount: '', date: '', category: '' });
  };

  // معالجة إضافة مصروف جديد
  const handleAddExpense = () => {
    if (!formData.name || !formData.amount || !formData.category) {
      toast({
        title: "خطأ",
        description: "برجاء إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const result = addExpense({
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category as ExpenseCategory,
      date: formData.date,
      notes: formData.notes
    });

    if (!result.success) {
      toast({
        title: "خطأ",
        description: result.errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    setIsExpenseDialogOpen(false);
    setFormData({
      name: '',
      amount: '',
      category: '',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  // معالجة إضافة دفعة
  const handleAddPayment = () => {
    if (!selectedExpense) return;

    const newPayment = {
      amount: Number(repaymentAmount),
      date: format(repaymentDate, 'yyyy-MM-dd'),
      notes: repaymentNotes
    };

    const result = addPayment(selectedExpense.id, newPayment);
    if (result.success) {
      setRepaymentAmount('');
      setRepaymentNotes('');
      setRepaymentDate(new Date());
      setIsRepaymentDialogOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.amount || !formData.category) {
      return;
    }

    handleAddExpense();

    handleCloseDialog();
  };

  // دالة فتح نموذج الإضافة
  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setIsExpenseDialogOpen(true);
  };

  // معالجة ضغط Enter في نموذج المصروف الجديد
  const handleNewExpenseKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  // معالجة ضغط Enter في نموذج سداد السلفة
  const handleRepaymentKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddPayment();
    }
  };

  // تعديل دالة handleNewLoanSubmit
  const handleOpenNewLoanDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsNewLoanDialogOpen(true);
  };

  const handleNewLoanSubmit = () => {
    if (!selectedExpense) return;

    const updatedExpense = {
      ...selectedExpense,
      additions: [
        ...(selectedExpense.additions || []),
        {
          amount: parseFloat(newLoanAmount || '0'),
          date: format(newLoanDate, 'yyyy-MM-dd'),
          notes: newLoanNotes || ''
        }
      ]
    };

    updateExpense(selectedExpense.id, updatedExpense);
    setIsNewLoanDialogOpen(false);
    setNewLoanAmount('');
    setNewLoanNotes('');
    setNewLoanDate(new Date());
    setSelectedExpense(null);
  };

  // دالة لفتح نموذج السلفة الجديدة
  const handleOpenNewLoanForm = (expense: Expense) => {
    const personName = getPersonNameFromLoan(expense.name);
    setSelectedPersonName(personName);
    
    // حساب رقم السلفة الجديدة
    const personLoans = expenses.filter(e => 
      e.category === 'سلف من المحل' && 
      getPersonNameFromLoan(e.name) === personName
    ).length;
    
    setLoanCounter(personLoans + 1);
    setNewLoanFormData({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    });
    setIsNewLoanFormOpen(true);
  };

  // دالة لإضافة سلفة جديدة
  const handleAddNewLoan = () => {
    if (!selectedPersonName || !newLoanFormData.amount) return;

    const result = addExpense({
      name: selectedPersonName,
      amount: parseFloat(newLoanFormData.amount),
      category: 'سلف من المحل',
      date: newLoanFormData.date,
      notes: `بداية سلفة ${loanCounter}`,
      payments: []
    } as Expense);

    if (result.success) {
      setIsNewLoanFormOpen(false);
      setNewLoanFormData({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setSelectedPersonName('');
    }
  };

  // دالة لتصفية المصروفات وتجميع السلف
  const filterExpenses = (expenses: Expense[]) => {
    // تجميع السلف حسب الشخص
    const loansByPerson = new Map<string, Expense[]>();
    
    // أولاً: تجميع كل السلف حسب الشخص
    expenses.forEach(expense => {
      if (expense.category === 'سلف من المحل') {
        const personName = expense.name;
        if (!loansByPerson.has(personName)) {
          loansByPerson.set(personName, []);
        }
        loansByPerson.get(personName)?.push(expense);
      }
    });

    // ثانياً: تصفية المصروفات
    return expenses.filter(expense => {
      // التحقق من البحث والتصنيف
      const matchesSearchTerm = expense.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || expense.category === selectedCategory;
      
      // إذا لم يكن سلفة، نطبق فقط فلتر البحث والتصنيف
      if (expense.category !== 'سلف من المحل') {
        return matchesSearchTerm && matchesCategory;
      }

      // للسلف: نتحقق من أنها آخر سلفة للشخص
      const personLoans = loansByPerson.get(expense.name) || [];
      if (personLoans.length === 0) return false;

      // ترتيب سلف الشخص حسب التاريخ (الأحدث أولاً)
      personLoans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // البحث عن آخر سلفة نشطة
      const activeLoans = personLoans.filter(loan => {
        const totalPaid = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        return totalPaid < loan.amount;
      });

      // إذا وجدت سلفة نشطة، نظهر أحدثها
      // إذا لم توجد سلفة نشطة، نظهر آخر سلفة منتهية
      const targetLoan = activeLoans.length > 0 ? activeLoans[0] : personLoans[0];

      // نعرض فقط السلفة المستهدفة
      return expense.id === targetLoan.id && matchesSearchTerm && matchesCategory;
    });
  };

  const filteredExpenses = filterExpenses(expenses)
    .filter(expense => {
      const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || expense.category === selectedCategory;
      
      let matchesDate = true;
      const expenseDate = new Date(expense.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'جميع المصروفات':
          matchesDate = true;
          break;
        case 'اليوم الحالي':
          matchesDate = format(expenseDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          break;
        case 'الشهر الحالي':
          matchesDate = format(expenseDate, 'yyyy-MM') === format(today, 'yyyy-MM');
          break;
        case 'السنة الحالية':
          matchesDate = format(expenseDate, 'yyyy') === format(today, 'yyyy');
          break;
        case 'تخصيص':
          if (customDateRange?.from) {
            const startDate = startOfDay(customDateRange.from);
            const endDate = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
            
            matchesDate = expenseDate >= startDate && expenseDate <= endDate;
          } else {
            matchesDate = true;
          }
          break;
      }

      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      // ترتيب السلف من الأحدث للأقدم
      if (a.category === 'سلف من المحل' && b.category === 'سلف من المحل') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // إذا كان أحدهما سلفة والآخر لا، السلف تظهر أولاً
      if (a.category === 'سلف من المحل' && b.category !== 'سلف من المحل') return -1;
      if (a.category !== 'سلف من المحل' && b.category === 'سلف من المحل') return 1;
      
      // باقي المصروفات من الأحدث للأقدم
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // تجميع المصروفات حسب السنة والشهر واليوم
  const groupExpensesByDate = (expenses: Expense[]) => {
    const grouped = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = {};
      if (!acc[year][month][day]) acc[year][month][day] = [];
      
      acc[year][month][day].push(expense);
      return acc;
    }, {} as Record<number, Record<number, Record<number, Expense[]>>>);
    
    return grouped;
  };

  const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onDelete }) => {
    const [expandedYears, setExpandedYears] = useState<number[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [expandedDays, setExpandedDays] = useState<string[]>([]);
    
    const groupedExpenses = groupExpensesByDate(expenses);
    
    const toggleYear = (year: number) => {
      setExpandedYears(prev => 
        prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
      );
    };
    
    const toggleMonth = (year: number, month: number) => {
      const key = `${year}-${month}`;
      setExpandedMonths(prev =>
        prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
      );
    };
    
    const toggleDay = (year: number, month: number, day: number) => {
      const key = `${year}-${month}-${day}`;
      setExpandedDays(prev =>
        prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
      );
    };
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="p-2 border">الاسم</th>
              <th className="p-2 border">الفئة</th>
              <th className="p-2 border">المبلغ</th>
              <th className="p-2 border">الملاحظات</th>
              <th className="p-2 border">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedExpenses).sort((a, b) => Number(b[0]) - Number(a[0])).map(([year, months]) => (
              <React.Fragment key={year}>
                {/* صف السنة */}
                <tr 
                  className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleYear(Number(year))}
                >
                  <td colSpan={5} className="p-3 border-b font-bold text-center">
                    سنة {year}
                  </td>
                </tr>
                
                {/* الشهور */}
                {expandedYears.includes(Number(year)) && 
                  Object.entries(months).sort((a, b) => Number(b[0]) - Number(a[0])).map(([month, days]) => (
                    <React.Fragment key={`${year}-${month}`}>
                      {/* صف الشهر */}
                      <tr 
                        className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleMonth(Number(year), Number(month))}
                      >
                        <td colSpan={5} className="p-3 border-b font-bold text-center">
                          {format(new Date(Number(year), Number(month)), 'MMMM', { locale: ar })}
                        </td>
                      </tr>
                      
                      {/* الأيام */}
                      {expandedMonths.includes(`${year}-${month}`) &&
                        Object.entries(days).sort((a, b) => Number(b[0]) - Number(a[0])).map(([day, dayExpenses]) => (
                          <React.Fragment key={`${year}-${month}-${day}`}>
                            {/* صف اليوم */}
                            <tr 
                              className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleDay(Number(year), Number(month), Number(day))}
                            >
                              <td colSpan={5} className="p-3 border-b font-bold text-center">
                                {format(new Date(Number(year), Number(month), Number(day)), 'PPP', { locale: ar })}
                              </td>
                            </tr>
                            
                            {/* مصروفات اليوم */}
                            {expandedDays.includes(`${year}-${month}-${day}`) && dayExpenses.map(expense => (
                              <tr key={expense.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{expense.name}</td>
                                <td className="p-2">{expense.category}</td>
                                <td className="p-2">{calculateTotalLoanAmount(expense).toLocaleString('en-US')}</td>
                                <td className="p-2">{expense.notes || '-'}</td>
                                <td className="p-2">
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onDelete && onDelete(expense.id)}
                                      className={getButtonStyle('red')}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                    </React.Fragment>
                  ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="p-3 text-center border-t">
                <div className="flex justify-center items-center gap-2">
                  <span>الإجمالي العام</span>
                  <span>{expenses.reduce((sum, expense) => sum + calculateTotalLoanAmount(expense), 0).toLocaleString('en-US')} </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // تحويل المعاملات إلى تنسيق موحد مع فصل دورات السلف
  const transformTransactions = (loans: Expense[]) => {
    // ترتيب السلف من الأحدث للأقدم
    const sortedLoans = [...loans].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let allTransactions = [];
    let loanCounter = sortedLoans.length;

    sortedLoans.forEach((loan, loanIndex) => {
      const transactions = [];
      const loanNumber = loanCounter--;
      const isLastLoan = loanIndex === sortedLoans.length - 1;
      
      // تجميع كل العمليات لهذه السلفة وترتيبها حسب التاريخ
      const allOperations = [
        // بداية السلفة
        {
          date: loan.date,
          type: 'بداية سلفة',
          amount: 0,
          operation: loan.amount,
          remaining: loan.amount,
          notes: `بداية السلفة ${!isLastLoan ? `رقم ${loanNumber}` : ''} ${loan.notes ? `- ${loan.notes}` : ''}`,
          isFullyPaid: false
        },
        // الإضافات
        ...(loan.additions?.map(addition => ({
          date: addition.date,
          type: 'إضافة',
          amount: 0, // سيتم حسابها لاحقاً
          operation: addition.amount,
          remaining: 0, // سيتم حسابها لاحقاً
          notes: `تم زيادة الدين بمبلغ ${addition.amount.toLocaleString()} ${addition.notes ? `- ${addition.notes}` : ''}`,
          isFullyPaid: false
        })) || []),
        // المدفوعات
        ...(loan.payments?.map(payment => ({
          date: payment.date,
          type: 'دفعة',
          amount: 0, // سيتم حسابها لاحقاً
          operation: payment.amount,
          remaining: 0, // سيتم حسابها لاحقاً
          notes: `تم سداد ${payment.amount.toLocaleString()} ${payment.notes ? `- ${payment.notes}` : ''}`,
          isFullyPaid: false
        })) || [])
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // ترتيب تصاعدي حسب التاريخ

      // حساب القيم المتبقية والمبالغ
      let currentRemaining = 0;
      allOperations.forEach((operation, index) => {
        if (operation.type === 'بداية سلفة') {
          currentRemaining = operation.remaining;
        } else {
          operation.amount = currentRemaining;
          if (operation.type === 'إضافة') {
            currentRemaining += operation.operation;
          } else if (operation.type === 'دفعة') {
            currentRemaining -= operation.operation;
          }
          operation.remaining = currentRemaining;
          
          // تحديث نوع آخر دفعة إذا كان المتبقي صفر
          if (operation.type === 'دفعة' && currentRemaining === 0) {
            operation.type = 'سداد نهائي';
            operation.notes = `تم السداد بكامل المبلغ المتبقي ${!isLastLoan ? `للسلفة رقم ${loanNumber}` : ''}`;
          }
        }
      });

      // إضافة العمليات المرتبة إلى المصفوفة
      transactions.push(...allOperations);

      // إضافة فاصل بين السلف إذا كانت هناك سلفة تالية
      if (loanIndex < sortedLoans.length - 1) {
        transactions.push({
          date: '',
          type: 'فاصل',
          amount: 0,
          operation: 0,
          remaining: 0,
          notes: '───────────────────',
          isFullyPaid: false
        });
      }

      allTransactions = [...allTransactions, ...transactions];
    });

    return allTransactions;
  };

  // تحديث عرض الجدول
  const PaymentHistoryDialog = () => {
    if (!selectedExpense) return null;

    // البحث عن جميع السلف للشخص المحدد
    const personLoans = expenses
      .filter(expense => 
        expense.category === 'سلف من المحل' && 
        getPersonNameFromLoan(expense.name) === getPersonNameFromLoan(selectedExpense.name)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // تجميع كل المعاملات
    const allTransactions = transformTransactions(personLoans);

    return (
      <Dialog open={showPaymentsHistory} onOpenChange={setShowPaymentsHistory}>
        <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
          <DialogHeader className="text-center border-b pb-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <h2 className="text-lg font-medium text-gray-400 mb-1">سجل معاملات المدفوعات</h2>
              <h1 className="text-3xl font-bold text-red-900">{selectedExpense?.name}</h1>
            </div>
            
            {/* ملخص السلفة الحالية */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm">
              <div className="grid grid-cols-2 gap-12 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-600">المبلغ الكلي</p>
                  <p className="text-lg font-bold">{calculateTotalLoanAmount(selectedExpense).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">المبلغ المتبقي</p>
                  <p className="text-lg font-bold text-blue-600">
                    {(calculateTotalLoanAmount(selectedExpense) - calculateTotalPayments(selectedExpense.payments)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center">التاريخ</th>
                  <th className="px-4 py-2 text-center">نوع المعاملة</th>
                  <th className="px-4 py-2 text-center">ملاحظات</th>
                  <th className="px-4 py-2 text-center">القيمة</th>
                  <th className="px-4 py-2 text-center">العملية</th>
                  <th className="px-4 py-2 text-center">المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {sortTransactions(allTransactions).map((transaction, index) => {
                  if (transaction.type === 'فاصل') {
                    return (
                      <tr key={index}>
                        <td colSpan={6} className="text-center text-gray-400 py-2">
                          {transaction.notes}
                        </td>
                      </tr>
                    );
                  }

                  const isLoanStart = transaction.type === 'بداية سلفة';
                  const isAddition = transaction.type === 'إضافة';
                  const isPayment = transaction.type === 'سداد نهائي' || transaction.type === 'دفعة';

                  const style = {
                    rowClass: isLoanStart ? 'bg-red-50' : 
                             isAddition ? 'bg-yellow-50' : 
                             transaction.remaining === 0 ? 'bg-green-50' : 'bg-blue-50',
                    textClass: isLoanStart ? 'text-red-600' : 
                              isAddition ? 'text-yellow-600' : 
                              transaction.remaining === 0 ? 'text-green-600' : 'text-blue-600'
                  };

                  return (
                    <tr key={index} className={`border-b ${style.rowClass} hover:bg-gray-50/50`}>
                      <td className="px-4 py-2 text-center">
                        {format(new Date(transaction.date), 'PPP', { locale: ar })}
                      </td>
                      <td className={`px-4 py-2 text-center font-bold ${style.textClass}`}>
                        {transaction.type}
                      </td>
                      <td className="px-4 py-2 text-center max-w-[200px] truncate" title={transaction.notes}>
                        {transaction.type === 'بداية سلفة' ? (
                          <span className="font-bold text-red-600">
                            {transaction.notes}
                          </span>
                        ) : (
                          transaction.notes
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {transaction.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {transaction.operation?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {transaction.remaining?.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPaymentsHistory(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // إضافة حالة الأخطاء للدفعات
  const [paymentErrors, setPaymentErrors] = useState({
    amount: '',
    date: ''
  });

  // دالة التحقق من صحة الدفعة
  const validatePaymentField = (name: string, value: any, remainingAmount?: number) => {
    let error = '';
    switch(name) {
      case 'amount':
        if (!value) {
          error = 'يجب إدخال مبلغ الدفعة';
        } else if (parseFloat(value) <= 0) {
          error = 'مبلغ الدفعة يجب أن يكون أكبر من صفر';
        } else if (remainingAmount !== undefined && parseFloat(value) > remainingAmount) {
          error = 'مبلغ الدفعة أكبر من المبلغ المتبقي';
        }
        break;
      case 'date':
        if (!value) {
          error = 'يجب اختيار تاريخ الدفعة';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) {
            error = 'لا يمكن اختيار تاريخ مستقبلي';
          }
        }
        break;
    }
    setPaymentErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // إضافة حالة الأخطاء للإضافات
  const [additionErrors, setAdditionErrors] = useState({
    amount: '',
    date: ''
  });

  // دالة التحقق من صحة الإضافة
  const validateAdditionField = (name: string, value: any) => {
    let error = '';
    switch(name) {
      case 'amount':
        if (!value) {
          error = 'يجب إدخال المبلغ';
        } else if (parseFloat(value) <= 0) {
          error = 'المبلغ يجب أن يكون أكبر من صفر';
        }
        break;
      case 'date':
        if (!value) {
          error = 'يجب اختيار التاريخ';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          if (selectedDate > today) {
            error = 'لا يمكن اختيار تاريخ مستقبلي';
          }
        }
        break;
    }
    setAdditionErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // دالة للتحقق من حالة السداد الكامل للسلفة
  const isLoanFullyPaid = (expense: Expense) => {
    const totalAmount = calculateTotalLoanAmount(expense);
    const totalPaid = calculateTotalPayments(expense.payments);
    return totalPaid >= totalAmount;
  };

  // دالة للتحقق من وجود سلفة أحدث لنفس الشخص
  const hasNewerLoan = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل') return false;
    
    // استخراج اسم الشخص من السلفة
    const currentPersonName = getPersonNameFromLoan(expense.name);
    
    // البحث عن سلفة أحدث لنفس الشخص
    return expenses.some(e => 
      e.category === 'سلف من المحل' &&
      e.id !== expense.id && // تأكد من أنها ليست نفس السلفة
      getPersonNameFromLoan(e.name) === currentPersonName &&
      new Date(e.date) > new Date(expense.date)
    );
  };

  // دالة للتحقق من أن السلفة هي الأحدث للشخص
  const isLatestLoanForPerson = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل') return false;
    
    // استخراج اسم الشخص من السلفة
    const currentPersonName = getPersonNameFromLoan(expense.name);
    
    // البحث عن سلفة أحدث لنفس الشخص
    return !expenses.some(e => 
      e.category === 'سلف من المحل' &&
      e.id !== expense.id && // تأكد من أنها ليست نفس السلفة
      getPersonNameFromLoan(e.name) === currentPersonName &&
      new Date(e.date) > new Date(expense.date)
    );
  };

  // دالة للتحقق من أن السلفة هي الوحيدة للشخص
  const isOnlyLoanForPerson = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل') return false;
    
    // استخراج اسم الشخص من السلفة
    const currentPersonName = getPersonNameFromLoan(expense.name);
    
    // عد عدد السلف لنفس الشخص
    const loansCount = expenses.filter(e => 
      e.category === 'سلف من المحل' &&
      getPersonNameFromLoan(e.name) === currentPersonName
    ).length;
    
    return loansCount === 1;
  };

  // دالة للتحقق من أن السلفة هي آخر سلفة منتهية للشخص وليس له سلف نشطة
  const isLatestPaidLoanForPerson = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل' || !isLoanFullyPaid(expense)) return false;
    
    // استخراج اسم الشخص من السلفة
    const currentPersonName = getPersonNameFromLoan(expense.name);
    
    // التحقق من عدم وجود سلف نشطة (غير منتهية) لنفس الشخص
    const hasActiveLoans = expenses.some(e => 
      e.category === 'سلف من المحل' &&
      getPersonNameFromLoan(e.name) === currentPersonName &&
      !isLoanFullyPaid(e)
    );
    
    // إذا كان هناك سلف نشطة، لا نظهر زر سلفة جديدة
    if (hasActiveLoans) return false;
    
    // البحث عن سلفة منتهية أحدث لنفس الشخص
    return !expenses.some(e => 
      e.category === 'سلف من المحل' &&
      e.id !== expense.id && // تأكد من أنها ليست نفس السلفة
      isLoanFullyPaid(e) && // تأكد من أنها منتهية
      getPersonNameFromLoan(e.name) === currentPersonName &&
      new Date(e.date) > new Date(expense.date)
    );
  };

  // دالة للتحقق من أن السلفة هي السلفة الوحيدة المنتهية للشخص وليس له سلف نشطة
  const isOnlyPaidLoanForPerson = (expense: Expense) => {
    if (expense.category !== 'سلف من المحل' || !isLoanFullyPaid(expense)) return false;
    
    // استخراج اسم الشخص من السلفة
    const currentPersonName = getPersonNameFromLoan(expense.name);
    
    // التحقق من عدم وجود سلف نشطة (غير منتهية) لنفس الشخص
    const hasActiveLoans = expenses.some(e => 
      e.category === 'سلف من المحل' &&
      getPersonNameFromLoan(e.name) === currentPersonName &&
      !isLoanFullyPaid(e)
    );
    
    // إذا كان هناك سلف نشطة، لا نظهر زر سلفة جديدة
    if (hasActiveLoans) return false;
    
    // عد عدد السلف المنتهية لنفس الشخص
    const paidLoansCount = expenses.filter(e => 
      e.category === 'سلف من المحل' &&
      isLoanFullyPaid(e) &&
      getPersonNameFromLoan(e.name) === currentPersonName
    ).length;
    
    return paidLoansCount === 1;
  };

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مصروفات الخزينه</h1>
        {canManageExpenses && (
          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog}>إضافة مصروف جديد</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  إضافة مصروف جديد
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4" onKeyDown={handleNewExpenseKeyDown}>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="font-semibold">اسم المصروف</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, name: value }));
                      validateField('name', value);
                    }}
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-500">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="font-semibold">القيمة</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, amount: value }));
                      validateField('amount', value);
                    }}
                    className={fieldErrors.amount ? 'border-red-500' : ''}
                  />
                  {fieldErrors.amount && (
                    <p className="text-sm text-red-500">{fieldErrors.amount}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="font-semibold">التصنيف</Label>
                  <Select
                    value={formData.category}
                    onValueChange={value => {
                      setFormData(prev => ({ ...prev, category: value }));
                      validateField('category', value);
                    }}
                  >
                    <SelectTrigger className={fieldErrors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          <span className={cn(
                            category === 'سلف من المحل' && "font-bold text-blue-600"
                          )}>
                            {category}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.category && (
                    <p className="text-sm text-red-500">{fieldErrors.category}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label className="font-semibold">التاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-right font-normal",
                          !formData.date && "text-muted-foreground",
                          fieldErrors.date && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.date ? (
                          formatDate(formData.date)
                        ) : (
                          <span>اختر تاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={date => {
                          const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                          setFormData(prev => ({ ...prev, date: formattedDate }));
                          validateField('date', formattedDate);
                        }}
                        locale={ar}
                        className="rounded-md border scale-90 origin-top"
                        disabled={false}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.date && (
                    <p className="text-sm text-red-500">{fieldErrors.date}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="font-semibold">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogActions 
                onCancel={() => {
                  setFieldErrors({ name: '', amount: '', date: '', category: '' });
                  handleCloseDialog();
                }}
                onConfirm={() => {
                  const isNameValid = validateField('name', formData.name);
                  const isAmountValid = validateField('amount', formData.amount);
                  const isCategoryValid = validateField('category', formData.category);
                  const isDateValid = validateField('date', formData.date);

                  if (isNameValid && isAmountValid && isCategoryValid && isDateValid) {
                    handleSubmit();
                  }
                }}
                disabled={Object.values(fieldErrors).some(error => error !== '')}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100/50 p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي مصروفات اليوم</p>
              <h3 className="text-2xl font-bold mt-1">{stats.daily.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-100/50 p-6 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي مصروفات الشهر</p>
              <h3 className="text-2xl font-bold mt-1">{stats.monthly.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-100/50 p-6 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي مصروفات السنة</p>
              <h3 className="text-2xl font-bold mt-1">{stats.yearly.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* فلترة */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="بحث باسم المصروف"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-bold">الكل</SelectItem>
            {EXPENSE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                <span className={cn(
                  category === 'سلف من المحل' && "font-bold text-blue-600"
                )}>
                  {category}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(value) => setDateFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="التاريخ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="جميع المصروفات" className="font-bold">جميع المصروفات</SelectItem>
            <SelectItem value="اليوم الحالي">اليوم الحالي</SelectItem>
            <SelectItem value="الشهر الحالي">الشهر الحالي</SelectItem>
            <SelectItem value="السنة الحالية">السنة الحالية</SelectItem>
            <SelectItem value="تخصيص">تخصيص</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter === 'تخصيص' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px]">
                {customDateRange?.from ? (
                  customDateRange.to ? (
                    <>من {formatDate(customDateRange.from, 'short')} إلى {formatDate(customDateRange.to, 'short')}</>
                  ) : (
                    formatDate(customDateRange.from)
                  )
                ) : (
                  <>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    اختر التاريخ
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <div className="p-0 flex justify-between items-center border-b">
                <span className="text-lg">اختر التاريخ</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setCustomDateRange(null);
                    setDateFilter('جميع المصروفات');
                  }}
                >
                  مسح
                </Button>
              </div>
              <Calendar
                mode="range"
                selected={customDateRange}
                onSelect={(range: DateRange | undefined) => setCustomDateRange(range || null)}
                locale={ar}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* جدول السلف */}
      {filterByCategory(filteredExpenses, 'سلف من المحل').length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center text-red-600 bg-red-50 py-2 rounded-lg">
            سلف من المحل
          </h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-center">الاسم</th>
                <th className="px-4 py-2 text-center">التصنيف</th>
                <th className="px-4 py-2 text-center">المبلغ</th>
                <th className="px-4 py-2 text-center">المدفوع</th>
                <th className="px-4 py-2 text-center">المتبقي</th>
                <th className="px-4 py-2 text-center">التاريخ</th>
                <th className="px-4 py-2 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sortByDateDesc(filterByCategory(filteredExpenses, 'سلف من المحل')).map((expense) => {
                const totalPaid = expense.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
                return (
                  <tr
                    key={expense.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (!isExpenseDialogOpen) {
                        setSelectedExpense(expense);
                        setShowPaymentsHistory(true);
                      }
                    }}
                  >
                    <td className="px-4 py-2 text-center">{expense.name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-red-600 font-bold">{expense.category}</span>
                    </td>
                    <td className="px-4 py-2 text-center">{calculateTotalLoanAmount(expense)}</td>
                    <td className="px-4 py-2 text-center">{totalPaid}</td>
                    <td className="px-4 py-2 text-center">{calculateRemainingAmount(expense)}</td>
                    <td className="px-4 py-2 text-center">{formatDate(new Date(expense.date))}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-end items-center">
                        {!isLoanFullyPaid(expense) ? (
                          // السلفة غير مسددة بالكامل: تظهر كل الأزرار
                          <>
                            <div className="w-[120px]">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExpense(expense);
                                  setIsRepaymentDialogOpen(true);
                                  setShowPaymentsHistory(false);
                                }}
                              >
                                سداد
                              </Button>
                            </div>
                            <div className="w-[120px]">
                              <Button
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenNewLoanDialog(expense);
                                  setShowPaymentsHistory(false);
                                }}
                              >
                                إضافة على السلفة
                              </Button>
                            </div>
                            <div className="w-[32px]">
                              <Button
                                variant="ghost"
                                className={getButtonStyle('red')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('هل تريد حذف هذه السلفة ؟ سيتم التعديل على الإجماليات')) {
                                    deleteExpense(expense.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          // السلفة مسددة بالكامل: يظهر زر "سلفة جديدة" فقط إذا كانت السلفة الوحيدة أو آخر سلفة منتهية للشخص
                          (isOnlyPaidLoanForPerson(expense) || isLatestPaidLoanForPerson(expense)) && (
                            <div className="w-[120px]">
                              <Button
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenNewLoanForm(expense);
                                  setShowPaymentsHistory(false);
                                }}
                              >
                                سلفة جديدة
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* صف الإجماليات */}
              <tr className="bg-gray-100 text-center font-bold">
                <td colSpan={2} className="p-3 border-t">الإجمالي</td>
                <td className="p-3 border-t">
                  {filterByCategory(filteredExpenses, 'سلف من المحل')
                    .reduce((sum, expense) => sum + calculateTotalLoanAmount(expense), 0)
                    .toLocaleString('en-US')}
                </td>
                <td className="p-3 border-t">
                  {filterByCategory(filteredExpenses, 'سلف من المحل')
                    .reduce((sum, expense) => sum + (expense.payments?.reduce((pSum, payment) => pSum + payment.amount, 0) || 0), 0)
                    .toLocaleString('en-US')}
                </td>
                <td className="p-3 border-t">
                  {filterByCategory(filteredExpenses, 'سلف من المحل')
                    .reduce((sum, expense) => sum + calculateRemainingAmount(expense), 0)
                    .toLocaleString('en-US')}
                </td>
                <td colSpan={2} className="p-3 border-t"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {/* جدول مصروفات الخزينة */}
      {filterByCategory(filteredExpenses, 'سلف من المحل', true).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600 bg-blue-50 py-2 rounded-lg">
            مصروفات الخزينة
          </h2>
          <ExpensesTable 
            expenses={expenses.filter(expense => expense.category !== 'سلف من المحل')}
            onDelete={deleteExpense}
          />
        </div>
      )}
      {/* نافذة سداد السلفة */}
      <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              إضافة دفعة جديدة
            </DialogTitle>
            {selectedExpense && (
              <div className="text-center mt-2">
                <p className="text-gray-600">اسم صاحب السلفة</p>
                <p className="text-lg font-bold text-blue-600">{selectedExpense.name}</p>
              </div>
            )}
          </DialogHeader>

          {selectedExpense && (
            <div className="grid gap-6 py-4">
              {/* عرض المبلغ المتبقي */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-600">المبلغ الكلي</p>
                    <p className="text-lg font-bold">{calculateTotalLoanAmount(selectedExpense).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600">المبلغ المتبقي</p>
                    <p className="text-lg font-bold text-blue-600">
                      {(calculateTotalLoanAmount(selectedExpense) - calculateTotalPayments(selectedExpense.payments)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* نموذج إدخال الدفعة */}
              <div className="grid gap-4" onKeyDown={handleRepaymentKeyDown}>
                <div className="grid gap-2">
                  <Label htmlFor="repaymentAmount">مبلغ الدفعة</Label>
                  <Input
                    id="repaymentAmount"
                    type="number"
                    value={repaymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setRepaymentAmount(value);
                      validatePaymentField('amount', value, calculateTotalLoanAmount(selectedExpense) - calculateTotalPayments(selectedExpense.payments));
                    }}
                    className={paymentErrors.amount ? 'border-red-500' : ''}
                  />
                  {paymentErrors.amount && (
                    <p className="text-sm text-red-500">{paymentErrors.amount}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="repaymentDate">التاريخ</Label>
                  <Input
                    id="repaymentDate"
                    type="date"
                    value={format(repaymentDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newDate = new Date(value);
                      setRepaymentDate(newDate);
                      validatePaymentField('date', value);
                    }}
                    className={paymentErrors.date ? 'border-red-500' : ''}
                  />
                  {paymentErrors.date && (
                    <p className="text-sm text-red-500">{paymentErrors.date}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="repaymentNotes">ملاحظات</Label>
                  <Input
                    id="repaymentNotes"
                    value={repaymentNotes}
                    onChange={(e) => setRepaymentNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogActions
                onCancel={() => {
                  setPaymentErrors({ amount: '', date: '' });
                  setIsRepaymentDialogOpen(false);
                  setRepaymentAmount('');
                  setRepaymentNotes('');
                }}
                onConfirm={() => {
                  const isAmountValid = validatePaymentField(
                    'amount', 
                    repaymentAmount,
                    calculateTotalLoanAmount(selectedExpense) - calculateTotalPayments(selectedExpense.payments)
                  );
                  const isDateValid = validatePaymentField('date', repaymentDate);

                  if (isAmountValid && isDateValid) {
                    handleAddPayment();
                  }
                }}
                disabled={Object.values(paymentErrors).some(error => error !== '')}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* حوار إضافة */}
      <Dialog open={isNewLoanDialogOpen} onOpenChange={setIsNewLoanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newLoanAmount">المبلغ</Label>
              <Input
                id="newLoanAmount"
                type="number"
                value={newLoanAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewLoanAmount(value);
                  validateAdditionField('amount', value);
                }}
                className={additionErrors.amount ? 'border-red-500' : ''}
              />
              {additionErrors.amount && (
                <p className="text-sm text-red-500">{additionErrors.amount}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="font-semibold">تاريخ الإضافة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-right font-normal",
                      additionErrors.date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(newLoanDate, 'PPP', { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newLoanDate}
                    onSelect={date => {
                      if (date) {
                        setNewLoanDate(date);
                        validateAdditionField('date', date);
                      }
                    }}
                    locale={ar}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              {additionErrors.date && (
                <p className="text-sm text-red-500">{additionErrors.date}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newLoanNotes" className="font-semibold">ملاحظات</Label>
              <Textarea
                id="newLoanNotes"
                value={newLoanNotes}
                onChange={(e) => setNewLoanNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogActions
            onCancel={() => {
              setAdditionErrors({ amount: '', date: '' });
              setIsNewLoanDialogOpen(false);
              setNewLoanAmount('');
              setNewLoanNotes('');
            }}
            onConfirm={() => {
              const isAmountValid = validateAdditionField('amount', newLoanAmount);
              const isDateValid = validateAdditionField('date', newLoanDate);
              if (isAmountValid && isDateValid) {
                handleNewLoanSubmit();
              }
            }}
            disabled={Object.values(additionErrors).some(error => error !== '')}
            confirmText="إضافة"
          />
        </DialogContent>
      </Dialog>
      {/* نموذج السلفة الجديدة */}
      <Dialog open={isNewLoanFormOpen} onOpenChange={setIsNewLoanFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سلفة جديدة {loanCounter} لـ {selectedPersonName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>المبلغ</Label>
              <Input
                type="number"
                min="0"
                value={newLoanFormData.amount}
                onChange={e => setNewLoanFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="أدخل المبلغ"
              />
            </div>

            <div>
              <Label>التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-right", !newLoanFormData.date && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {newLoanFormData.date ? formatDate(newLoanFormData.date) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={parse(newLoanFormData.date, 'yyyy-MM-dd', new Date())}
                    onSelect={date => date && setNewLoanFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={newLoanFormData.notes}
                onChange={e => setNewLoanFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل الملاحظات"
              />
            </div>
          </div>

          <DialogActions
            onCancel={() => setIsNewLoanFormOpen(false)}
            onConfirm={handleAddNewLoan}
            confirmText="إضافة السلفة"
            disabled={!newLoanFormData.amount || parseFloat(newLoanFormData.amount) <= 0}
          />
        </DialogContent>
      </Dialog>
      <PaymentHistoryDialog />
    </div>
  );
}

interface ExpensesTableProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}
