import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Debt } from "../types"
import { formatDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { CalendarDays, Receipt, AlertCircle, Image as ImageIcon } from "lucide-react"
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DebtDetailsDialogProps {
  debt: Debt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebtDetailsDialog({ debt, open, onOpenChange }: DebtDetailsDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!debt) return null

  const paidPercentage = ((debt.amount - debt.remainingAmount) / debt.amount) * 100

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center">
              <div className="text-lg">اسم الدائن : {debt.debtorName}</div>
              <div className="text-sm text-muted-foreground">رقم الموبايل: {debt.phoneNumber}</div>
            </DialogTitle>
          </DialogHeader>

          {debt && (
            <>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">نسبة السداد</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            paidPercentage === 100 && "bg-green-500",
                            paidPercentage > 0 && paidPercentage < 100 && "bg-yellow-500",
                            paidPercentage === 0 && "bg-red-500"
                          )}
                          style={{ width: `${paidPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{paidPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">تاريخ بداية الدين:</span>
                  <span className="text-sm">{formatDate(debt.debtDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">تاريخ الاستحقاق:</span>
                  <span className="text-sm">{formatDate(debt.dueDate) || "غير محدد"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-muted/10 p-2 rounded">
                  <div className="text-sm text-muted-foreground">المبلغ الأصلي</div>
                  <div className="text-lg font-bold">{debt.amount}</div>
                </div>
                <div className="bg-muted/10 p-2 rounded">
                  <div className="text-sm text-muted-foreground">المبلغ المدفوع</div>
                  <div className="text-lg font-bold">{debt.amount - debt.remainingAmount}</div>
                </div>
                <div className="bg-muted/10 p-2 rounded">
                  <div className="text-sm text-muted-foreground">المبلغ المتبقي</div>
                  <div className="text-lg font-bold">{debt.remainingAmount}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-lg font-bold text-center text-destructive mb-2">سجل المدفوعات</div>
                <ScrollArea className="h-[180px] rounded-md">
                  <table className="w-full text-right">
                    <thead>
                      <tr>
                        <th className="pb-2 font-medium">التاريخ</th>
                        <th className="pb-2 font-medium">المبلغ</th>
                        <th className="pb-2 font-medium">الملاحظات</th>
                        <th className="pb-2 font-medium">الفاتورة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* عملية بداية الدين */}
                      <tr className="border-t">
                        <td className="py-2">{formatDate(debt.debtDate)}</td>
                        <td className="py-2 text-destructive">+{debt.amount}</td>
                        <td className="py-2">بداية الدين</td>
                        <td className="py-2">
                          {debt.invoiceImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedImage(debt.invoiceImage)}
                            >
                              <ImageIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                      {/* سجل المدفوعات */}
                      {debt.payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="py-2">{formatDate(payment.paymentDate)}</td>
                          <td className="py-2 text-green-600">-{payment.amount}</td>
                          <td className="py-2">{payment.notes || "-"}</td>
                          <td className="py-2">
                            {payment.receiptImage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedImage(payment.receiptImage)}
                              >
                                <ImageIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الفاتورة */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0">
          <div className="relative aspect-video w-full">
            <img
              src={selectedImage || ""}
              alt="صورة الإيصال"
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
