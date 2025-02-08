import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebts } from "../contexts/DebtsContext"
import { Debt, DebtStatus } from "../types"
import { AddDebtDialog } from "./AddDebtDialog"
import { AddPaymentDialog } from "./AddPaymentDialog"
import { DebtDetailsDialog } from "./DebtDetailsDialog";
import { EditDebtDialog } from "./EditDebtDialog"
import { formatDate } from "@/lib/date-utils";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DebtsList() {
  const {
    debts,
    deleteDebt,
    refreshDebts
  } = useDebts()

  const { user } = useAuth()
  const canManageDebts = user?.permissions.includes("manage_debts") || user?.role === "admin"

  // دالة مساعدة للتحقق من الصلاحيات
  const canModifyDebt = (debtCreatedBy: string) => {
    if (!user) return false
    if (user.role === "admin") return true
    // المستخدم الذي لديه صلاحية manage_debts يمكنه التعديل على جميع الديون
    if (user.permissions.includes("manage_debts")) return true
    return false
  }

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DebtStatus | "all">("all")
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const filteredDebts = debts.filter((debt) => {
    const matchesSearch = debt.debtorName
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || debt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // دالة مساعدة لتحديد حالة الدين
  const getDebtStatus = (debt: Debt) => {
    if (debt.remainingAmount === debt.amount) {
      return {
        text: "غير مدفوع",
        className: "bg-red-100 text-red-800"
      }
    } else if (debt.remainingAmount === 0) {
      return {
        text: "تم السداد",
        className: "bg-green-100 text-green-800"
      }
    } else {
      return {
        text: "مدفوع جزئياً",
        className: "bg-yellow-100 text-yellow-800"
      }
    }
  }

  // حساب إجمالي الديون النشطة فقط
  const getTotalDebts = () => {
    return debts
      .filter(debt => debt.remainingAmount > 0)
      .reduce((total, debt) => total + debt.amount, 0)
  }

  // حساب إجمالي المدفوع للديون النشطة فقط (من خلال المدفوعات فقط)
  const getTotalPaid = () => {
    return debts
      .filter(debt => debt.remainingAmount > 0)
      .reduce((total, debt) => total + debt.payments.reduce((sum, payment) => sum + payment.amount, 0), 0)
  }

  // حساب إجمالي المتبقي (سيكون فقط للديون النشطة لأن المسددة متبقيها = 0)
  const getTotalRemaining = () => {
    return debts
      .filter(debt => debt.remainingAmount > 0)
      .reduce((total, debt) => total + debt.remainingAmount, 0)
  }

  // حساب عدد الديون النشطة (غير المدفوعة بالكامل)
  const getActiveDebtsCount = () => {
    return debts.filter(debt => debt.remainingAmount > 0).length
  }

  const selectedDebt = selectedDebtId ? debts.find(d => d.id === selectedDebtId) : null

  // 1. عند الضغط على زر الحذف
  const handleDeleteDebt = async (debt: Debt) => {
    if (!canModifyDebt(debt.createdBy || "")) {
      toast.error("ليس لديك صلاحية لحذف هذا الدين")
      return
    }
    setDebtToDelete(debt)
    setIsDeleteDialogOpen(true)
  }

  // 2. عند تأكيد الخطوة الأولى
  const handleConfirmFirstStep = () => {
    setIsConfirmDeleteOpen(true)
    setIsDeleteDialogOpen(false)
  }

  // 3. عند تأكيد الحذف النهائي
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      if (debtToDelete?.id) {
        await deleteDebt(debtToDelete.id)
        toast.success("تم حذف الدين بنجاح")
        setIsConfirmDeleteOpen(false)
        setDebtToDelete(null)
        // تحديث القائمة
        await refreshDebts()
      }
    } catch (error) {
      console.error("خطأ في حذف الدين:", error)
      toast.error("حدث خطأ أثناء حذف الدين")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* لوحة الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium">إجمالي الديون النشطة</h3>
          <p className="text-2xl font-bold">{getTotalDebts()}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-green-800">إجمالي المدفوع للديون النشطة</h3>
          <p className="text-2xl font-bold text-green-800">{getTotalPaid()}</p>
        </div>
        <div className="bg-red-800 p-4 rounded-lg shadow text-white">
          <h3 className="text-sm font-medium">إجمالي الديون الحاليه</h3>
          <p className="text-2xl font-bold">{getTotalRemaining()}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-red-800">عدد الديون النشطة</h3>
          <p className="text-2xl font-bold text-red-800">{getActiveDebtsCount()}</p>
        </div>
      </div>

      {/* شريط الأدوات */}
      <div className="space-y-4">
        {/* عناصر التحكم */}
        <div className="md:flex md:items-center md:gap-4">
          {/* في الموبايل: العناصر تحت بعضها، في الويب: بجانب بعضها */}
          <div className="flex-1 space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* مربع البحث */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="بحث باسم الدائن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* فلتر التصنيف */}
            <div className="w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DebtStatus | "all")}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                  <SelectItem value="paid">مدفوع بالكامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* زر إضافة دين جديد */}
          {canManageDebts && (
            <div className="mt-3 md:mt-0">
              <Button onClick={() => setIsAddDebtOpen(true)} className="w-full md:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                إضافة دين جديد
              </Button>
            </div>
          )}
        </div>

        {/* جدول السلف */}
        {filteredDebts.filter(debt => debt.debtType === "business_loan").length > 0 && (
          <div className="border rounded-lg mb-8">
            <div className="bg-blue-50 p-4 border-b text-center">
              <h2 className="text-lg font-bold text-blue-800">سلف المطعم</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] text-right font-bold text-foreground/90">اسم الدائن</TableHead>
                  <TableHead className="w-[200px] text-right font-bold text-foreground/90">غرض السلفة</TableHead>
                  <TableHead className="w-[100px] text-right font-bold text-foreground/90">المبلغ</TableHead>
                  <TableHead className="w-[100px] text-right font-bold text-foreground/90">المدفوع</TableHead>
                  <TableHead className="w-[100px] text-right font-bold text-foreground/90">المتبقي</TableHead>
                  <TableHead className="w-[230px] text-right font-bold text-foreground/90">تاريخ السلفة</TableHead>
                  <TableHead className="w-[160px] text-right font-bold text-foreground/90">الحالة</TableHead>
                  <TableHead className="w-[140px] text-right font-bold text-foreground/90">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts
                  .filter(debt => debt.debtType === "business_loan")
                  .map((debt) => (
                  <TableRow 
                    key={debt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedDebtId(debt.id)
                      setIsDetailsOpen(true)
                    }}
                  >
                    <TableCell>{debt.debtorName}</TableCell>
                    <TableCell>{debt.businessPurpose === "cash_flow" ? "سيولة نقدية" : 
                               debt.businessPurpose === "inventory" ? "بضاعة" :
                               debt.businessPurpose === "equipment" ? "معدات" :
                               debt.businessPurpose === "renovations" ? "تجديدات" : ""}</TableCell>
                    <TableCell>{debt.amount}</TableCell>
                    <TableCell>{debt.payments.reduce((sum, payment) => sum + payment.amount, 0)}</TableCell>
                    <TableCell>{debt.remainingAmount}</TableCell>
                    <TableCell>{formatDate(debt.createdAt)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getDebtStatus(debt).className}`}>
                        {getDebtStatus(debt).text}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {canModifyDebt(debt.createdBy) && (
                          <>
                            {/* إظهار زر إضافة دفعة وتعديل فقط إذا كان الدين غير مسدد بالكامل */}
                            {debt.remainingAmount > 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDebtId(debt.id)
                                    setIsAddPaymentOpen(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 ml-1" />
                                  دفعة جديدة
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDebtId(debt.id)
                                    setIsEditOpen(true)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation() // منع انتشار الحدث للصف
                                handleDeleteDebt(debt)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* صف الإجماليات */}
                <TableRow className="bg-blue-50/50 font-bold">
                  <TableCell>الإجمالي</TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    {filteredDebts
                      .filter(debt => debt.debtType === "business_loan")
                      .reduce((total, debt) => total + (debt.amount || 0), 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {filteredDebts
                      .filter(debt => debt.debtType === "business_loan")
                      .reduce((total, debt) => total + debt.payments.reduce((sum, payment) => sum + payment.amount, 0), 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {filteredDebts
                      .filter(debt => debt.debtType === "business_loan")
                      .reduce((total, debt) => total + debt.remainingAmount, 0)
                      .toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* جدول الديون العادية */}
        {filteredDebts.filter(debt => debt.debtType !== "business_loan").length > 0 && (
          <div className="border rounded-lg">
            <div className="bg-red-50 p-4 border-b text-center">
              <h2 className="text-lg font-bold text-red-800">الديون العادية</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px] text-right font-bold text-foreground/90">اسم الدائن</TableHead>
                  <TableHead className="w-[110px] text-right font-bold text-foreground/90">المبلغ</TableHead>
                  <TableHead className="w-[110px] text-right font-bold text-foreground/90">المدفوع</TableHead>
                  <TableHead className="w-[110px] text-right font-bold text-foreground/90">المتبقي</TableHead>
                  <TableHead className="w-[230px] text-right font-bold text-foreground/90">تاريخ الدين</TableHead>
                  <TableHead className="w-[160px] text-right font-bold text-foreground/90">الحالة</TableHead>
                  <TableHead className="w-[140px] text-right font-bold text-foreground/90">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts
                  .filter(debt => debt.debtType !== "business_loan")
                  .map((debt) => (
                  <TableRow 
                    key={debt.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedDebtId(debt.id)
                      setIsDetailsOpen(true)
                    }}
                  >
                    <TableCell>{debt.debtorName}</TableCell>
                    <TableCell>{debt.amount}</TableCell>
                    <TableCell>{debt.payments.reduce((sum, payment) => sum + payment.amount, 0)}</TableCell>
                    <TableCell>{debt.remainingAmount}</TableCell>
                    <TableCell>{formatDate(debt.createdAt)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getDebtStatus(debt).className}`}>
                        {getDebtStatus(debt).text}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {canModifyDebt(debt.createdBy) && (
                          <>
                            {/* إظهار زر إضافة دفعة وتعديل فقط إذا كان الدين غير مسدد بالكامل */}
                            {debt.remainingAmount > 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDebtId(debt.id)
                                    setIsAddPaymentOpen(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 ml-1" />
                                  دفعة جديدة
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDebtId(debt.id)
                                    setIsEditOpen(true)
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation() // منع انتشار الحدث للصف
                                handleDeleteDebt(debt)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* نوافذ الحوار */}
        <AddDebtDialog
          open={isAddDebtOpen}
          onOpenChange={setIsAddDebtOpen}
        />
        <AddPaymentDialog
          isOpen={isAddPaymentOpen}
          onClose={() => {
            setIsAddPaymentOpen(false)
            setSelectedDebtId(null)
          }}
          debtId={selectedDebtId || ""}
        />
        <DebtDetailsDialog
          debt={selectedDebt}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
        {selectedDebtId && (
          <EditDebtDialog
            debt={debts.find((d) => d.id === selectedDebtId)!}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        )}
        {/* إشعار الحذف - المرحلة الأولى */}
        <AlertDialog 
          open={isDeleteDialogOpen} 
        >
          <AlertDialogContent className="max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right font-bold text-xl mb-2">حذف الدين</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                <div className="space-y-2">
                  <p className="text-red-600 font-semibold">تنبيه!</p>
                  <p>هل تريد حذف هذا الدين؟</p>
                  {debtToDelete && (
                    <>
                      <p className="text-sm text-gray-600">
                        سيتم استرجاع مبلغ : {(debtToDelete.amount - (debtToDelete.remainingAmount || 0)).toLocaleString()} للنقديه
                      </p>
                      <p className="text-sm text-gray-600">
                        وسيتم خصم {debtToDelete.remainingAmount?.toLocaleString()} من المصروفات
                      </p>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse space-x-reverse space-x-2">
              <AlertDialogCancel 
                className="flex-1"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDebtToDelete(null)
                }}
              >
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmFirstStep}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                متابعة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* إشعار الحذف - التأكيد النهائي */}
        <AlertDialog 
          open={isConfirmDeleteOpen}
        >
          <AlertDialogContent className="max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right font-bold text-xl mb-2">تأكيد نهائي</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                <div className="space-y-2">
                  <p className="text-red-600 font-semibold">تحذير!</p>
                  <p>هل أنت متأكد تماماً من حذف هذا الدين؟</p>
                  {debtToDelete && (
                    <>
                      <p className="text-sm text-gray-600">
                        سيتم إضافة {(debtToDelete.amount - (debtToDelete.remainingAmount || 0)).toLocaleString()} إلى النقدية
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-600">لا يمكن التراجع عن هذا الإجراء.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse space-x-reverse space-x-2">
              <AlertDialogCancel 
                className="flex-1"
                onClick={() => {
                  setIsConfirmDeleteOpen(false)
                  setIsDeleteDialogOpen(true)
                }}
              >
                رجوع
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={isLoading}
              >
                {isLoading ? "جاري الحذف..." : "نعم، احذف نهائياً"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
