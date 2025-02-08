import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { InventoryMovement, InventoryMovementType } from "../types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface InventoryMovementsProps {
  movements: InventoryMovement[]
  productName?: string
}

export function InventoryMovements({ movements, productName }: InventoryMovementsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<InventoryMovementType | "الكل">("الكل")
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  // تصفية الحركات
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = productName ? true : 
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "الكل" || movement.type === selectedType

    const matchesDate = !dateRange?.from || !dateRange?.to || (
      new Date(movement.createdAt) >= dateRange.from &&
      new Date(movement.createdAt) <= dateRange.to
    )

    return matchesSearch && matchesType && matchesDate
  })

  // حساب الإجماليات
  const totals = filteredMovements.reduce((acc, movement) => {
    if (movement.type === 'إضافة') {
      acc.totalIn += movement.quantity
      acc.totalInValue += movement.quantity * movement.price
    } else if (movement.type === 'سحب') {
      acc.totalOut += movement.quantity
      acc.totalOutValue += movement.quantity * movement.price
    }
    return acc
  }, {
    totalIn: 0,
    totalOut: 0,
    totalInValue: 0,
    totalOutValue: 0
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {productName ? `حركة المخزون - ${productName}` : 'حركة المخزون'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* أدوات التصفية */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as InventoryMovementType | "الكل")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع الحركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">الكل</SelectItem>
                <SelectItem value="إضافة">إضافة</SelectItem>
                <SelectItem value="سحب">سحب</SelectItem>
                <SelectItem value="تعديل">تعديل</SelectItem>
                <SelectItem value="جرد">جرد</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              locale={ar}
              placeholder="اختر الفترة"
            />
          </div>

          {/* ملخص الحركة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totals.totalIn}</div>
                <div className="text-sm text-gray-500">إجمالي الوارد</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totals.totalOut}</div>
                <div className="text-sm text-gray-500">إجمالي المنصرف</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totals.totalInValue.toLocaleString()} جنيه</div>
                <div className="text-sm text-gray-500">قيمة الوارد</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{totals.totalOutValue.toLocaleString()} جنيه</div>
                <div className="text-sm text-gray-500">قيمة المنصرف</div>
              </CardContent>
            </Card>
          </div>

          {/* جدول الحركات */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الكمية القديمة</TableHead>
                  <TableHead>الكمية الجديدة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      لا توجد حركات مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.createdAt), "d MMMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <span className={
                          movement.type === 'إضافة' ? 'text-green-500' :
                          movement.type === 'سحب' ? 'text-red-500' :
                          'text-blue-500'
                        }>
                          {movement.type}
                        </span>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.oldQuantity}</TableCell>
                      <TableCell>{movement.newQuantity}</TableCell>
                      <TableCell>{movement.price.toLocaleString()} جنيه</TableCell>
                      <TableCell>
                        {(movement.quantity * movement.price).toLocaleString()} جنيه
                      </TableCell>
                      <TableCell>{movement.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 