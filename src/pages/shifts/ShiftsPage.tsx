import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useShifts } from "@/contexts/ShiftsContext"
import { Textarea } from "@/components/ui/textarea"
import { CanModify } from "@/components/ui/can-modify"

export function ShiftsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addShift, shifts } = useShifts()
  
  // حساب إجماليات الورديات
  const totals = shifts.reduce((acc, shift) => {
    return {
      sales: acc.sales + (Number(shift.sales) || 0),
      expenses: acc.expenses + (Number(shift.expenses) || 0),
      cash: acc.cash + ((Number(shift.sales) || 0) - (Number(shift.expenses) || 0))
    }
  }, { sales: 0, expenses: 0, cash: 0 })

  const [date, setDate] = useState<Date>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [shiftType, setShiftType] = useState<string>()
  const [sales, setSales] = useState("")
  const [expenses, setExpenses] = useState("")
  const [notes, setNotes] = useState("")
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsFormSubmitted(true)

    if (!date) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "برجاء اختيار التاريخ",
        duration: 2000,
      })
      return
    }

    if (!shiftType) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "برجاء اختيار نوع الوردية",
        duration: 2000,
      })
      return
    }

    // التحقق من القيم وتحويلها إلى أرقام
    const salesNum = parseFloat(sales || "0")
    const expensesNum = parseFloat(expenses || "0")

    if (isNaN(salesNum) || isNaN(expensesNum)) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "برجاء إدخال أرقام صحيحة للمبيعات والمصروفات",
        duration: 2000,
      })
      return
    }

    // تنسيق التاريخ بشكل صحيح
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    try {
      // إضافة الوردية
      addShift({
        date: formattedDate,
        type: shiftType as "morning" | "evening",
        sales: salesNum,
        expenses: expensesNum,
        cash: salesNum - expensesNum,
        notes: notes || "",
      })

      toast({
        title: "تم إضافة الوردية بنجاح",
        description: "تم حفظ بيانات الوردية",
        duration: 1000,
      })

      // التوجيه إلى صفحة سجل الورديات
      navigate("/shifts/history")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الوردية",
        duration: 2000,
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">تسجيل وردية جديدة</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* الصف الأول: التاريخ ونوع الوردية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !date && isFormSubmitted && "text-error"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP", { locale: ar })
                    ) : (
                      <span>اختر تاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>نوع الوردية</Label>
              <Select value={shiftType} onValueChange={setShiftType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوردية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">صباحي</SelectItem>
                  <SelectItem value="evening">مسائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الصف الثاني: المبيعات والمصروفات والنقدية */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>المبيعات</Label>
              <Input
                name="sales"
                type="number"
                step="0.01"
                value={sales}
                onChange={(e) => setSales(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>المصروفات</Label>
              <Input
                name="expenses"
                type="number"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>النقدية</Label>
              <Input
                type="number"
                value={
                  sales && expenses
                    ? (parseFloat(sales || "0") - parseFloat(expenses || "0")).toFixed(2)
                    : "0.00"
                }
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* حقل الملاحظات */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="اكتب ملاحظاتك هنا..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] max-h-[300px] overflow-y-auto"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <CanModify permission="manage_shifts">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/shifts/history")}
              >
                إلغاء
              </Button>
            </CanModify>
            <Button type="submit">حفظ</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
