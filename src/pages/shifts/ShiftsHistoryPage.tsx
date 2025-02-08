import React from "react"
import { Link } from "react-router-dom"
import { useShifts, Shift } from "@/contexts/ShiftsContext"
import { format, parseISO, getYear, getMonth } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CanModify } from "@/components/ui/can-modify"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Card
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { DialogContent } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"
import { Eye, Pencil, Trash2, Plus } from "lucide-react"
import { CalendarIcon } from "lucide-react"

interface GroupedShifts {
  [year: string]: {
    [month: string]: {
      [day: string]: Shift[]
    }
  }
}

interface Totals {
  sales: number
  expenses: number
  cash: number
}

interface YearGroup {
  shifts: Shift[]
  months: Record<string, MonthGroup>
}

interface MonthGroup {
  shifts: Shift[]
  days: Record<string, DayGroup>
}

interface DayGroup {
  shifts: Shift[]
}

const formatDate = (date: string) => {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

const getArabicMonth = (monthStr: string) => {
  const arabicMonths = [
    "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ]
  const monthNumber = parseInt(monthStr) - 1
  return arabicMonths[monthNumber]
}

// دالة مساعدة لتنسيق محتوى الملاحظات حسب المستوى
const formatNotesContent = (item: any, level: 'shift' | 'day' | 'month' | 'year') => {
  if (!item) return '';

  // تنسيق مختلف لكل مستوى
  if (level === 'shift') {
    // للوردية: نص الملاحظة فقط
    return item.notes ? item.notes.split('\n')[0] || '' : '';
  }
  
  if (level === 'day') {
    // لليوم: نوع الوردية + السطر الأول من الملاحظة
    const firstLine = item.notes ? item.notes.split('\n')[0] || '' : '';
    return `${item.type || '-'} - ${firstLine}`;
  }
  
  if (level === 'month' || level === 'year') {
    // للشهر والسنة: المعلومات المالية فقط
    const sales = item.sales || 0;
    const expenses = item.expenses || 0;
    const treasury = item.treasury || 0;
    
    return `التاريخ: ${formatDate(item.date)}
المبيعات: ${sales.toLocaleString()}
المصروفات: ${expenses.toLocaleString()}
النقدي: ${treasury.toLocaleString()}`;
  }
  
  return '';
};

export function ShiftsHistoryPage() {
  const shiftsContext = useShifts()
  const [expandedYear, setExpandedYear] = React.useState<string | null>(null)
  const [expandedMonth, setExpandedMonth] = React.useState<string | null>(null)
  const [expandedDay, setExpandedDay] = React.useState<string | null>(null)
  const [selectedShiftNotes, setSelectedShiftNotes] = React.useState<string | null>(null)

  // التحقق من وجود السياق
  if (!shiftsContext) {
    console.error("ShiftsContext is not available")
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-lg text-muted-foreground">جاري تحميل البيانات...</div>
      </div>
    )
  }

  const { shifts, clearAllShifts } = shiftsContext
  
  // التحقق من وجود الورديات
  if (!shifts || shifts.length === 0) {
    console.log("No shifts found in context")
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">الورديات</h1>
          <CanModify permission="manage_shifts">
            <Button size="lg" asChild>
              <Link to="/shifts/new" className="gap-2">
                <Plus className="w-5 h-5" />
                وردية جديدة
              </Link>
            </Button>
          </CanModify>
        </div>
        <Card className="p-4">
          <div className="text-center text-muted-foreground py-8">
            لا توجد ورديات مسجلة
          </div>
        </Card>
      </div>
    )
  }

  console.log("Shifts loaded:", shifts.length)

  // تجميع الورديات حسب التاريخ
  const groupedShifts = shifts.reduce((acc, shift) => {
    const [year, month, day] = shift.date.split("-")
    const yearKey = year
    const monthKey = `${year}-${month}`
    const dayKey = shift.date

    if (!acc[yearKey]) {
      acc[yearKey] = {
        shifts: [],
        months: {},
      }
    }

    if (!acc[yearKey].months[monthKey]) {
      acc[yearKey].months[monthKey] = {
        shifts: [],
        days: {},
      }
    }

    if (!acc[yearKey].months[monthKey].days[dayKey]) {
      acc[yearKey].months[monthKey].days[dayKey] = {
        shifts: [],
      }
    }

    acc[yearKey].shifts.push(shift)
    acc[yearKey].months[monthKey].shifts.push(shift)
    acc[yearKey].months[monthKey].days[dayKey].shifts.push(shift)

    return acc
  }, {} as Record<string, YearGroup>)

  // ترتيب الورديات حسب التاريخ
  const sortedYears = Object.keys(groupedShifts).sort((a, b) => a.localeCompare(b))

  // دالة مساعدة للتحقق من وجود ملاحظات
  const hasNotes = (shifts: Shift[]): boolean => {
    return shifts.some(shift => shift.notes && shift.notes.trim() !== '')
  }

  // حساب إجماليات المستوى
  const calculateTotals = (shifts: Shift[]): Totals => {
    return shifts.reduce(
      (acc, shift) => ({
        sales: acc.sales + (Number(shift.sales) || 0),
        expenses: acc.expenses + (Number(shift.expenses) || 0),
        cash: acc.cash + (Number(shift.actualCash) || Number(shift.sales) - Number(shift.expenses) || 0)
      }),
      { sales: 0, expenses: 0, cash: 0 }
    )
  }

  // حساب إجماليات الشهر
  const calculateMonthTotals = (days: Record<string, DayGroup>): Totals => {
    return Object.values(days).reduce(
      (acc, day) => {
        const dayTotals = calculateTotals(day.shifts)
        return {
          sales: acc.sales + dayTotals.sales,
          expenses: acc.expenses + dayTotals.expenses,
          cash: acc.cash + dayTotals.cash,
        }
      },
      { sales: 0, expenses: 0, cash: 0 }
    )
  }

  // حساب إجماليات السنة
  const calculateYearTotals = (months: Record<string, MonthGroup>): Totals => {
    return Object.values(months).reduce(
      (acc, month) => {
        const monthTotals = calculateMonthTotals(month.days)
        return {
          sales: acc.sales + monthTotals.sales,
          expenses: acc.expenses + monthTotals.expenses,
          cash: acc.cash + monthTotals.cash,
        }
      },
      { sales: 0, expenses: 0, cash: 0 }
    )
  }

  // الحصول على كل الملاحظات من مجموعة من الورديات
  const getAllNotes = (shifts: Shift[]): string => {
    return shifts
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(shift => shift.notes && shift.notes.trim() !== '')
      .map((shift, index, array) => {
        const date = format(parseISO(shift.date), "EEEE d MMMM yyyy", { locale: ar })
        const type = shift.type === "morning" ? "صباحية" : "مسائية"
        const sales = shift.sales.toLocaleString()
        const expenses = shift.expenses.toLocaleString()
        const cash = shift.cash.toLocaleString()
        
        // توسيط النص باستخدام المسافات
        const centerText = (text: string, width: number = 50) => {
          const padding = Math.max(0, width - text.length) / 2
          return ' '.repeat(Math.floor(padding)) + text
        }

        // إضافة علامة ** للنص البولد
        const boldText = (text: string) => `**${text}**`

        const lines = [
          centerText(boldText(`${date} - وردية ${type}`)),
          '',
          centerText(`المبيعات:  ${sales}  |  المصروفات:  ${expenses}  |  الخزينة:  ${cash}`),
          '',
          centerText(`"${shift.notes}"`)
        ]

        // إضافة الخط الفاصل فقط بين الورديات (ليس قبل أول وردية ولا بعد آخر وردية)
        if (index < array.length - 1) {
          lines.push('', centerText('-'.repeat(40)), '')
        }

        return lines.join('\n')
      })
      .join('\n')
  }

  // التحقق من وجود ملاحظات في شهر
  const hasMonthNotes = (days: Record<string, DayGroup>): boolean => {
    return Object.values(days).some(day => hasNotes(day.shifts))
  }

  // التحقق من وجود ملاحظات في سنة
  const hasYearNotes = (months: Record<string, MonthGroup>): boolean => {
    return Object.values(months).some(month => hasMonthNotes(month.days))
  }

  const handleYearClick = (year: string) => {
    setExpandedYear(expandedYear === year ? null : year)
    setExpandedMonth(null)
    setExpandedDay(null)
  }

  const handleMonthClick = (month: string) => {
    setExpandedMonth(expandedMonth === month ? null : month)
    setExpandedDay(null)
  }

  const handleDayClick = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day)
  }

  // حساب إجماليات الورديات
  const totals = shifts.reduce((acc, shift) => {
    return {
      sales: acc.sales + (Number(shift.sales) || 0),
      expenses: acc.expenses + (Number(shift.expenses) || 0),
      cash: acc.cash + (Number(shift.actualCash) || Number(shift.sales) - Number(shift.expenses) || 0)
    }
  }, { sales: 0, expenses: 0, cash: 0 })

  return (
    <div className="container mx-auto py-2">
      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="bg-blue-100/50 p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي المبيعات هنا</p>
              <h3 className="text-2xl font-bold mt-3">{totals.sales.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-100/50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي المصروفات هنا</p>
              <h3 className="text-2xl font-bold mt-3">{totals.expenses.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-100/50 p-6 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">إجمالي النقدي المتبقي هنا</p>
              <h3 className="text-2xl font-bold mt-3">{totals.cash.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الورديات</h1>
        <div className="flex gap-4">
          <CanModify permission="manage_shifts">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (window.confirm("هل أنت متأكد من حذف جميع الورديات؟")) {
                  clearAllShifts()
                }
              }}
            >
              حذف جميع الورديات
            </Button>
            <Button size="lg" asChild>
              <Link to="/shifts/new" className="gap-2">
                <Plus className="w-5 h-5" />
                وردية جديدة
              </Link>
            </Button>
          </CanModify>
        </div>
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px] text-right">التاريخ</TableHead>
              <TableHead className="text-center">نوع الوردية</TableHead>
              <TableHead className="text-center">المبيعات</TableHead>
              <TableHead className="text-center">المصروفات</TableHead>
              <TableHead className="text-center">النقدي</TableHead>
              <TableHead className="text-center">الفرق</TableHead>
              <TableHead className="text-center w-[40px]">ملاحظات</TableHead>
              <TableHead className="text-center w-[40px]">تعديل</TableHead>
              <TableHead className="text-center w-[40px]">حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedShifts).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground h-10">
                  لا توجد ورديات مسجلة
                </TableCell>
              </TableRow>
            ) : (
              sortedYears.map(year => {
                const yearTotals = calculateYearTotals(groupedShifts[year].months)
                return (
                  <React.Fragment key={`year-${year}`}>
                    {/* صف السنة */}
                    <TableRow 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleYearClick(year)}
                    >
                      <TableCell className="font-bold text-lg">{year}</TableCell>
                      <TableCell className="text-center">-</TableCell>
                      <TableCell className="text-center font-bold text-lg">{yearTotals.sales.toLocaleString()} </TableCell>
                      <TableCell className="text-center font-bold text-lg">{yearTotals.expenses.toLocaleString()} </TableCell>
                      <TableCell className="text-center font-bold text-lg">{yearTotals.cash.toLocaleString()} </TableCell>
                      <TableCell className="text-center"></TableCell>
                      <TableCell className="text-center">
                        {expandedYear === year && (
                          <div className="flex justify-center gap-2">
                            {hasYearNotes(groupedShifts[year].months) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const notes = Object.values(groupedShifts[year].months)
                                    .flatMap(month => Object.values(month.days))
                                    .flatMap(day => day.shifts)
                                  setSelectedShiftNotes(getAllNotes(notes))
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {/* لا نحتاج زر التعديل في صف السنة */}
                      </TableCell>
                      <TableCell className="text-center">
                        {expandedYear === year && (
                          <div className="flex justify-center gap-2">
                            <CanModify permission="manage_shifts">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  if (window.confirm(`هل تريد حذف جميع شهور سنة ${year}؟`)) {
                                    try {
                                      const shifts = Object.values(groupedShifts[year].months)
                                        .flatMap(month => Object.values(month.days))
                                        .flatMap(day => day.shifts);
                                      
                                      for (const shift of shifts) {
                                        await shiftsContext?.deleteShift(shift.id);
                                      }
                                    } catch (error) {
                                      // الخطأ سيتم معالجته في سياق الورديات
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CanModify>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* الشهور */}
                    {expandedYear === year && Object.entries(groupedShifts[year].months)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([monthKey, monthData]) => {
                      const monthTotals = calculateMonthTotals(monthData.days)
                      return (
                        <React.Fragment key={`month-${year}-${monthKey}`}>
                          <TableRow 
                            className="bg-muted/40 cursor-pointer hover:bg-muted/50 h-10"
                            onClick={() => handleMonthClick(monthKey)}
                          >
                            <TableCell className="font-medium text-base">
                              {getArabicMonth(monthKey.split('-')[1])}
                            </TableCell>
                            <TableCell className="text-center">-</TableCell>
                            <TableCell className="text-center font-medium text-base">{monthTotals.sales.toLocaleString()} </TableCell>
                            <TableCell className="text-center font-medium text-base">{monthTotals.expenses.toLocaleString()} </TableCell>
                            <TableCell className="text-center font-medium text-base">{monthTotals.cash.toLocaleString()} </TableCell>
                            <TableCell className="text-center"></TableCell>
                            <TableCell className="text-center">
                              {expandedMonth === monthKey && (
                                <div className="flex justify-center gap-2">
                                  {hasMonthNotes(monthData.days) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const notes = Object.values(monthData.days)
                                          .flatMap(day => day.shifts)
                                        setSelectedShiftNotes(getAllNotes(notes))
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {/* لا نحتاج زر التعديل في صف الشهر */}
                            </TableCell>
                            <TableCell className="text-center">
                              {expandedMonth === monthKey && (
                                <div className="flex justify-center gap-2">
                                  <CanModify permission="manage_shifts">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        if (window.confirm(`هل أنت متأكد من حذف شهر ${getArabicMonth(monthKey)}؟`)) {
                                          try {
                                            const shifts = Object.values(monthData.days)
                                              .flatMap(day => day.shifts);
                                            
                                            for (const shift of shifts) {
                                              await shiftsContext?.deleteShift(shift.id);
                                            }
                                          } catch (error) {
                                            // الخطأ سيتم معالجته في سياق الورديات
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </CanModify>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* الأيام */}
                          {expandedMonth === monthKey && Object.entries(monthData.days)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([dayKey, dayData]) => {
                            const dayTotals = calculateTotals(dayData.shifts)
                            return (
                              <React.Fragment key={`day-${year}-${monthKey}-${dayKey}`}>
                                <TableRow 
                                  className={cn(
                                    "bg-muted/20 cursor-pointer hover:bg-muted/30",
                                    expandedDay === dayKey ? "border-b-0" : ""
                                  )}
                                  onClick={() => handleDayClick(dayKey)}
                                >
                                  <TableCell className="font-medium">{formatDate(dayKey)}</TableCell>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">{dayTotals.sales.toLocaleString()} </TableCell>
                                  <TableCell className="text-center">{dayTotals.expenses.toLocaleString()} </TableCell>
                                  <TableCell className="text-center">{dayTotals.cash.toLocaleString()} </TableCell>
                                  <TableCell className="text-center"></TableCell>
                                  <TableCell className="text-center">
                                    {expandedDay === dayKey && (
                                      <div className="flex justify-center gap-2">
                                        {hasNotes(dayData.shifts) && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedShiftNotes(getAllNotes(dayData.shifts))}
                                            className="w-8 h-8"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {/* لا نحتاج زر التعديل في صف اليوم */}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {expandedDay === dayKey && (
                                      <div className="flex justify-center gap-2">
                                        <CanModify permission="manage_shifts">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              if (window.confirm(`هل أنت متأكد من حذف ورديات يوم ${formatDate(dayKey)}؟`)) {
                                                try {
                                                  for (const shift of dayData.shifts) {
                                                    await shiftsContext?.deleteShift(shift.id);
                                                  }
                                                } catch (error) {
                                                  // الخطأ سيتم معالجته في سياق الورديات
                                                }
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </CanModify>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>

                                {/* الورديات */}
                                {expandedDay === dayKey && dayData.shifts
                                  .sort((a, b) => a.type === "morning" ? -1 : 1)
                                  .map((shift) => (
                                  <TableRow 
                                    key={`shift-${shift.id}`}
                                    className="bg-muted/10 hover:bg-muted/20"
                                  >
                                    <TableCell className="text-muted-foreground">
                                      {formatDate(shift.date)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {shift.type === "morning" ? "صباحي" : "مسائي"}
                                    </TableCell>
                                    <TableCell className="text-center">{shift.sales.toLocaleString()} </TableCell>
                                    <TableCell className="text-center">{shift.expenses.toLocaleString()} </TableCell>
                                    <TableCell className="text-center">
                                      {shift.actualCash === (shift.sales - shift.expenses) 
                                        ? (shift.sales - shift.expenses).toLocaleString()
                                        : shift.actualCash.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {shift.actualCash !== (shift.sales - shift.expenses) ? (
                                        <div className={cn(
                                          shift.difference > 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                          {shift.difference > 0
                                            ? `زيادة : ${Math.round(shift.difference).toLocaleString()}`
                                            : `عجز: ${Math.round(Math.abs(shift.difference)).toLocaleString()}`}
                                        </div>
                                      ) : null}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {shift.notes && shift.notes.trim() !== '' && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedShiftNotes(getAllNotes([shift]));
                                          }}
                                          className="w-8 h-8"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <CanModify permission="manage_shifts">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          asChild
                                        >
                                          <Link to={`/shifts/${shift.id}/edit`}>
                                            <Pencil className="w-4 h-4" />
                                          </Link>
                                        </Button>
                                      </CanModify>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <CanModify permission="manage_shifts">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm("هل أنت متأكد من حذف هذه الوردية؟")) {
                                              try {
                                                await shiftsContext?.deleteShift(shift.id);
                                              } catch (error) {
                                                // الخطأ سيتم معالجته في سياق الورديات
                                              }
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </CanModify>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedShiftNotes} onOpenChange={() => setSelectedShiftNotes(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">ملاحظات الورديات</DialogTitle>
          </DialogHeader>
          <div 
            className="whitespace-pre-wrap text-center leading-5 py-2 max-h-[400px] overflow-y-auto"
            style={{
              fontFamily: 'Noto Kufi Arabic, sans-serif',
              fontSize: '1rem',
              direction: 'rtl',
              color: '#334155' // لون Slate-700 يناسب راحة العين
            }}
          >
            {selectedShiftNotes?.split('**').map((text, i) => 
              i % 2 === 0 ? 
                text : 
                <span key={i} className="font-bold">{text}</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
