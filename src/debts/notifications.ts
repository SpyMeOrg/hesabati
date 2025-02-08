import { toast } from 'sonner';
import { StorageService } from '../lib/storage';
import { Debt } from './types';

/**
 * خدمة التنبيهات للديون
 */
export class DebtNotifications {
  private static checkInterval: number | null = null;

  /**
   * بدء مراقبة الديون المستحقة
   */
  static startWatching(): void {
    if (this.checkInterval) return;

    // فحص فوري
    this.checkDueDebts();

    // فحص كل ساعة
    this.checkInterval = window.setInterval(() => {
      this.checkDueDebts();
    }, 3600000); // كل ساعة
  }

  /**
   * إيقاف مراقبة الديون
   */
  static stopWatching(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * فحص الديون المستحقة
   */
  private static checkDueDebts(): void {
    const debts = StorageService.getItem<Debt[]>('debts', []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    debts.forEach(debt => {
      if (debt.status === 'paid') return;

      const dueDate = new Date(debt.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // ديون مستحقة اليوم
      if (dueDate.getTime() === today.getTime()) {
        toast.warning(`دين مستحق اليوم: ${debt.debtorName} - ${debt.amount} `, {
          duration: 10000,
        });
      }
      // ديون متأخرة
      else if (dueDate < today) {
        const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        toast.error(`دين متأخر ${days} يوم: ${debt.debtorName} - ${debt.amount} `, {
          duration: 10000,
        });
      }
      // ديون تستحق غداً
      else if (dueDate.getTime() === today.getTime() + 86400000) {
        toast.info(`دين يستحق غداً: ${debt.debtorName} - ${debt.amount} `, {
          duration: 10000,
        });
      }
    });
  }

  /**
   * إظهار تنبيه عند إضافة دفعة
   */
  static showPaymentNotification(debtorName: string, amount: number, remaining: number): void {
    toast.success(
      `تم إضافة دفعة ${amount}  لـ ${debtorName}. المتبقي: ${remaining} `,
      { duration: 5000 }
    );
  }

  /**
   * إظهار تنبيه عند سداد الدين بالكامل
   */
  static showDebtPaidNotification(debtorName: string): void {
    toast.success(
      `تم سداد دين ${debtorName} بالكامل!`,
      { duration: 5000 }
    );
  }
}
