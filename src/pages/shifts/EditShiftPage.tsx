import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useShifts, type Shift } from "@/contexts/ShiftsContext"
import { useAuth } from "@/contexts/AuthContext"
import { format, parseISO } from "date-fns"
import { ar } from "date-fns/locale"
import { CanModify } from "@/components/ui/can-modify"

export function EditShiftPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { shifts, updateShift } = useShifts()
  const { toast } = useToast()
  const { user } = useAuth()

  // منع المشاهد من الوصول لصفحة التعديل
  if (user?.role === "viewer") {
    navigate("/shifts")
    return null
  }

  const shift = shifts.find((s) => s.id === id)

  if (!shift) {
    return (
      <div className="container py-6">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">خطأ</h1>
          <p className="text-gray-600">لم يتم العثور على الوردية المطلوبة</p>
          <Button onClick={() => navigate("/shifts")} className="mt-4">
            العودة للورديات
          </Button>
        </Card>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const sales = Number(formData.get("sales"))
    const expenses = Number(formData.get("expenses"))
    const notes = formData.get("notes") as string

    if (!shift) return

    try {
      updateShift({
        ...shift,
        sales,
        expenses,
        cash: sales - expenses,
        notes,
      })

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات الوردية",
        duration: 1000,
      })

      navigate("/shifts/history")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الوردية",
        duration: 1000,
      })
    }
  }

  const shiftDate = format(parseISO(shift.date), "EEEE d MMMM yyyy", { locale: ar })
  const shiftType = shift.type === "morning" ? "صباحية" : "مسائية"

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">تعديل وردية</h1>
            <p className="text-muted-foreground">
              {shiftType} - {shiftDate}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <CanModify>
                <div>
                  <Label htmlFor="sales">المبيعات</Label>
                  <Input
                    id="sales"
                    name="sales"
                    type="number"
                    defaultValue={shift.sales}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expenses">المصروفات</Label>
                  <Input
                    id="expenses"
                    name="expenses"
                    type="number"
                    defaultValue={shift.expenses}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={shift.notes}
                    rows={4}
                  />
                </div>
              </CanModify>

              <div className="flex justify-end gap-4">
                <CanModify>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/shifts/history")}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit">حفظ التغييرات</Button>
                </CanModify>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
