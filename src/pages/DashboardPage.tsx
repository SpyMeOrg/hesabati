import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DollarSign, Package2, History, Link2, Plus, Users, TrendingUp, Receipt, Wallet, CreditCard, LineChart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"
import { useShifts } from "@/contexts/ShiftsContext"
import { useDebts } from "@/debts/contexts/DebtsContext"
import { useExpenses } from "@/expenses/contexts/ExpensesContext"
import { useMemo, useEffect } from "react"
import { StorageService } from "@/lib/storage"
import { format } from 'date-fns';

export function DashboardPage() {
  const { user } = useAuth()
  const { shifts } = useShifts()
  const { debts, refreshDebts } = useDebts()
  const { expenses, refreshExpenses } = useExpenses()

  // تحديث البيانات عند فتح الصفحة فقط
  useEffect(() => {
    let isMounted = true;

    const updateData = async () => {
      if (!isMounted) return;
      
      try {
        await refreshDebts();
        refreshExpenses();
      } catch (error) {
        console.error('فشل تحديث البيانات:', error);
      }
    };

    updateData();

    return () => {
      isMounted = false;
    };
  }, []); // تشغيل مرة واحدة عند فتح الصفحة

  // حساب الإجماليات عند تغيير أي من البيانات
  const totals = useMemo(() => {
    // تجميع نقدي الوردية
    const shiftsCash = shifts.reduce(
      (acc, shift) => ({
        sales: acc.sales + (shift.sales || 0),
        expenses: acc.expenses + (shift.expenses || 0),
        cash: acc.cash + (shift.actualCash || shift.sales - shift.expenses || 0)
      }),
      { sales: 0, expenses: 0, cash: 0 }
    );

    // حساب إجمالي مصروفات الخزينة العادية (بدون السلف)
    const regularExpenses = expenses
      .filter(expense => expense.category !== 'سلف من المحل')
      .reduce((total, expense) => total + expense.amount, 0);

    // حساب إجمالي السلف المتبقية
    const remainingLoans = expenses
      .filter(expense => expense.category === 'سلف من المحل')
      .reduce((total, expense) => {
        // حساب إجمالي المبلغ (الأساسي + الإضافات)
        const additionsTotal = expense.additions?.reduce((sum, addition) => sum + addition.amount, 0) || 0;
        const totalAmount = expense.amount + additionsTotal;
        
        // حساب المدفوعات
        const totalPaid = expense.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        
        // المبلغ المتبقي = الإجمالي - المدفوعات
        const remainingAmount = totalAmount - totalPaid;
        return total + remainingAmount;
      }, 0);

    // حساب إجمالي المدفوعات المسددة من السلف (كل المدفوعات)
    const totalLoanPayments = expenses
      .filter(expense => expense.category === 'سلف من المحل')
      .reduce((total, expense) => {
        if (expense.payments) {
          return total + expense.payments.reduce((sum, payment) => sum + payment.amount, 0);
        }
        return total;
      }, 0);

    // حساب سلفة المطعم (الديون اللي استلفناها)
    const restaurantLoans = debts
      .filter(debt => debt.debtType === 'business_loan')  
      .reduce((total, debt) => total + debt.amount, 0);

    // حساب إجمالي المدفوع من الديون
    const totalDebtPayments = debts.reduce((total, debt) => {
      return total + (debt.payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }, 0);

    // حساب إجمالي المصروفات = مصروفات الورديات + مصروفات الخزينة + المدفوع من الديون
    // حيث مصروفات الخزينة = المصروفات العادية + المتبقي من السلف من المحل
    const totalExpenses = shiftsCash.expenses + (regularExpenses + remainingLoans) + totalDebtPayments;

    // حساب إجمالي النقدي المتبقي
    // النقدي المتبقي = (نقدي الورديات + سلفة المطعم) - (مصروفات الخزينة + المدفوع من الديون)
    const remainingCash = (shiftsCash.cash + restaurantLoans) - (regularExpenses + remainingLoans + totalDebtPayments);

    // حساب إجمالي الديون المتبقية (النشطة فقط)
    const totalRemainingDebts = debts.reduce((total, debt) => total + debt.remainingAmount, 0);

    // حساب صافي الربح/الخسارة = (النقدي المتبقي + إجمالي السلف) - إجمالي الديون المتبقية
    const netProfitLoss = (remainingCash + remainingLoans) - totalRemainingDebts;

    return {
      sales: shiftsCash.sales,
      expenses: totalExpenses,
      cash: remainingCash,
      salaf: remainingLoans,
      remainingDebts: totalRemainingDebts,
      netProfitLoss: netProfitLoss,
    };
  }, [shifts, debts, expenses]);

  return (
    <div className="container py-0 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      </div>

      {/* Stats Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-blue-100 mb-1">إجمالي المبيعات</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.sales.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-blue-100 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>مبيعات المشروع العامة</span>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-red-100 mb-1">إجمالي المصروفات</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.expenses.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-red-100 text-sm">
              <Receipt className="w-4 h-4" />
              <span>مصروفات المشروع العامة</span>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-cyan-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-cyan-100 mb-1">النقدي المتبقي</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.cash.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-cyan-100 text-sm">
              <Wallet className="w-4 h-4" />
              <span>الرصيد الحالي</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-orange-100 mb-1">إجمالي السلف</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.salaf.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-orange-100 text-sm">
              <Users className="w-4 h-4" />
              <span>السلف المستحق الخارجي</span>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-purple-100 mb-1">إجمالي الديون المتبقية</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.remainingDebts.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-purple-100 text-sm">
              <CreditCard className="w-4 h-4" />
              <span>الديون المستحقةعلى المحل</span>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 bg-white/10 rounded-full"></div>
          <div className="relative p-6">
            <h3 className="text-lg text-emerald-100 mb-1">صافي الربح / الخسارة</h3>
            <p className="text-3xl font-bold text-white mb-4">{totals.netProfitLoss.toLocaleString()}</p>
            <div className="inline-flex items-center gap-1 text-emerald-100 text-sm">
              <LineChart className="w-4 h-4" />
              <span>أداء المحل النهائي</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links and Current Shift */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Shift */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-6">الوردية الحالية</h2>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg">التاريخ:</span>
              <span className="font-medium text-lg" dir="ltr">
                {new Date().toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div className="flex justify-center mt-auto pt-10">
            {user?.permissions.includes('manage_shifts') && (
              <Link to="/shifts/new">
                <Button>+ تسجيل وردية جديدة</Button>
              </Link>
            )}
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">روابط سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link
              to="/shifts/history"
              className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <History className="w-6 h-6 ml-2" />
              <div>
                <div className="font-semibold">سجل الورديات</div>
                <div className="text-sm text-gray-600">عرض الورديات السابقة</div>
              </div>
            </Link>

            <Link
              to="/debts"
              className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <DollarSign className="w-6 h-6 ml-2" />
              <div>
                <div className="font-semibold">الديون</div>
                <div className="text-sm text-gray-600">إدارة الديون والمدفوعات</div>
              </div>
            </Link>

            {(user?.permissions.includes('view_users') || user?.role === 'admin') && (
              <Link
                to="/dashboard/users"
                className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Users className="w-6 h-6 ml-2" />
                <div>
                  <div className="font-semibold">المستخدمين</div>
                  <div className="text-sm text-gray-600">إدارة المستخدمين والصلاحيات</div>
                </div>
              </Link>
            )}

            <Link
              to="/inventory"
              className="flex items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Package2 className="w-6 h-6 ml-2" />
              <div>
                <div className="font-semibold">المخزون</div>
                <div className="text-sm text-gray-600">إدارة المخزون والمنتجات</div>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}