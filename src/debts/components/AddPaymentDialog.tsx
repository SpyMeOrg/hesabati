import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDebts } from "../contexts/DebtsContext"
import { format } from "date-fns"
import { toast } from "sonner"
import { AddPaymentData } from "../types"

interface AddPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  debtId: string
}

export function AddPaymentDialog({ isOpen, onClose, debtId }: AddPaymentDialogProps) {
  const { addPayment, getDebtById } = useDebts()
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [receiptImage, setReceiptImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح")
      return
    }

    setIsSubmitting(true)

    try {
      let imageBase64: string | null = null
      
      if (receiptImage instanceof File) {
        try {
          const reader = new FileReader()
          imageBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error("فشل في قراءة الفاتورة"))
            reader.readAsDataURL(receiptImage)
          })
        } catch (error) {
          console.error("خطأ في معالجة الفاتورة:", error)
          toast.error("حدث خطأ أثناء معالجة الالفاتورة")
          return
        }
      }

      const paymentData: AddPaymentData = {
        debtId,
        amount: parseFloat(amount),
        notes,
        paymentDate,
        receiptImage: imageBase64
      }

      console.log("بيانات الدفعة:", { 
        ...paymentData, 
        receiptImage: paymentData.receiptImage ? "موجودة" : "غير موجودة" 
      })
      
      await addPayment(paymentData)
      toast.success("تم إضافة الدفعة بنجاح")
      
      // إعادة تعيين النموذج فقط بعد نجاح العملية
      setAmount("")
      setNotes("")
      setPaymentDate(format(new Date(), "yyyy-MM-dd"))
      setReceiptImage(null)
      
      onClose()
    } catch (error) {
      console.error("خطأ في إضافة الدفعة:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("حدث خطأ غير متوقع أثناء إضافة الدفعة")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const debt = getDebtById(debtId)
  if (!debt) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("يرجى اختيار ملف صورة صالح")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الفاتورة يجب أن يكون أقل من 5 ميجابايت")
        return
      }
      setReceiptImage(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة دفعة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>المبلغ المدفوع</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              required
            />
          </div>
          <div>
            <Label>تاريخ الدفع</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>ملاحظات</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل ملاحظات (اختياري)"
            />
          </div>
          <div>
            <Label>صورة الإيصال (اختياري)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {receiptImage && (
              <p className="text-sm text-muted-foreground mt-1">
                تم اختيار: {receiptImage.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={!amount || isSubmitting}
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
