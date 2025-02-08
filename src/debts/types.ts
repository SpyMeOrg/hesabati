// أنواع البيانات الخاصة بنظام الديون
export type DebtStatus = "pending" | "partially_paid" | "paid" | "partial"

// أنواع الديون
export type DebtType = "regular" | "business_loan"

// أسباب السلف التشغيلية
export type BusinessPurpose = "equipment" | "renovations" | "inventory" | "cash_flow"

export interface Payment {
  id: string
  debtId: string
  amount: number
  notes?: string
  paymentDate: string
  createdAt: string
  receiptImage?: string | null
}

export interface Debt {
  id: string
  debtorName?: string     // اسم المدين
  phoneNumber?: string    // رقم الموبايل
  amount?: number         // المبلغ
  dueDate?: string       // تاريخ الاستحقاق
  debtDate: string
  status: DebtStatus    // حالة الدين
  description?: string   // وصف أو سبب الدين
  payments: Payment[]   // سجل المدفوعات
  remainingAmount: number // المبلغ المتبقي
  createdAt: string
  updatedAt: string
  createdBy: string     // معرف المستخدم الذي أنشأ الدين
  debtType?: DebtType    // نوع الدين
  businessPurpose?: BusinessPurpose  // سبب السلفة (في حالة سلف المطعم فقط)
  invoiceImage?: string | null  // صورة الفاتورة
}

// البيانات المطلوبة لإنشاء دين جديد
export interface AddDebtData {
  debtorName: string
  phoneNumber?: string
  amount: number
  dueDate?: string
  debtDate: string
  description?: string
  createdBy: string
  debtType: DebtType
  businessPurpose?: BusinessPurpose
  invoiceImage?: string | null  // صورة الفاتورة
}

// البيانات المطلوبة لتحديث دين
export type UpdateDebtData = Partial<AddDebtData>

export interface AddPaymentData {
  debtId: string
  amount: number
  notes?: string
  paymentDate: string
  receiptImage?: string | null
}

// واجهة سياق إدارة الديون
export interface DebtsContextType {
  debts: Debt[]
  addDebt: (data: AddDebtData) => Promise<Debt>
  updateDebt: (id: string, data: UpdateDebtData) => Promise<void>
  deleteDebt: (id: string) => Promise<void>
  addPayment: (data: AddPaymentData) => Promise<Payment>
  getDebtById: (id: string) => Debt | undefined
  refreshDebts: () => void
}
