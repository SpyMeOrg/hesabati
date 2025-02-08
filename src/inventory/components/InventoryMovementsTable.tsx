import { useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { InventoryMovement } from "../types"
import { useInventory } from "../contexts/InventoryContext"

interface InventoryMovementsTableProps {
  movements: InventoryMovement[]
  productName?: string
}

export function InventoryMovementsTable({ movements, productName }: InventoryMovementsTableProps) {
  const { products } = useInventory()

  // ترتيب الحركات من الأحدث إلى الأقدم
  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [movements])

  // الحصول على اسم المنتج
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>التاريخ</TableHead>
            {!productName && <TableHead>المنتج</TableHead>}
            <TableHead>نوع الحركة</TableHead>
            <TableHead>الكمية</TableHead>
            <TableHead>الرصيد السابق</TableHead>
            <TableHead>الرصيد الجديد</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>المستخدم</TableHead>
            <TableHead>ملاحظات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMovements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>
                {format(new Date(movement.createdAt), "d MMMM yyyy", { locale: ar })}
              </TableCell>
              {!productName && (
                <TableCell className="font-medium">{getProductName(movement.productId)}</TableCell>
              )}
              <TableCell>
                <span className={movement.type === 'إضافة' ? 'text-green-600' : 'text-red-600'}>
                  {movement.type}
                </span>
              </TableCell>
              <TableCell>{movement.quantity}</TableCell>
              <TableCell>{movement.oldQuantity}</TableCell>
              <TableCell>{movement.newQuantity}</TableCell>
              <TableCell>{movement.price.toLocaleString()} جنيه</TableCell>
              <TableCell>{movement.userId}</TableCell>
              <TableCell>{movement.notes || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 