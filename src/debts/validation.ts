import { AddDebtData, AddPaymentData } from './types';

/**
 * خدمة التحقق من صحة بيانات الديون
 */
export class DebtValidation {
  /**
   * التحقق من صحة بيانات الدين الجديد
   */
  static validateDebt(data: AddDebtData) {
    const errors: Record<string, string> = {};
    
    // التحقق من اسم المدين (اختياري)
    if (data.debtorName && data.debtorName.length < 3) {
      errors.debtorName = "اسم المدين يجب أن يكون 3 أحرف على الأقل";
    }
    
    // التحقق من رقم الهاتف (اختياري)
    if (data.phoneNumber && !data.phoneNumber.match(/^\d{11}$/)) {
      errors.phoneNumber = "رقم الهاتف يجب أن يكون 11 رقم";
    }
    
    // التحقق من المبلغ (اختياري)
    if (data.amount !== undefined) {
      if (isNaN(data.amount)) {
        errors.amount = "المبلغ يجب أن يكون رقم";
      } else if (data.amount < 0) {
        errors.amount = "المبلغ يجب أن يكون صفر أو أكبر";
      }
    }
    
    // التحقق من تاريخ الاستحقاق (اختياري)
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate);
      const today = new Date();
      if (isNaN(dueDate.getTime())) {
        errors.dueDate = "تاريخ الاستحقاق غير صحيح";
      } else if (dueDate < today) {
        errors.dueDate = "تاريخ الاستحقاق يجب أن يكون في المستقبل";
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * التحقق من صحة بيانات الدفع
   */
  static validatePayment(data: AddPaymentData, remainingAmount: number) {
    const errors: Record<string, string> = {};
    
    if (!data.amount || isNaN(data.amount)) {
      errors.amount = "المبلغ مطلوب";
    } else if (data.amount <= 0) {
      errors.amount = "المبلغ يجب أن يكون أكبر من صفر";
    } else if (data.amount > remainingAmount) {
      errors.amount = "المبلغ أكبر من المبلغ المتبقي";
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
