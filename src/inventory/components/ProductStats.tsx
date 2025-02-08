import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ProductStats as ProductStatsType } from "../types"

interface ProductStatsProps {
  stats: ProductStatsType
}

export function ProductStats({ stats }: ProductStatsProps) {
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">المنتج</TableCell>
          <TableCell>{stats.productName}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">الرصيد الحالي</TableCell>
          <TableCell>{stats.currentStock}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">إجمالي الوارد</TableCell>
          <TableCell className="text-green-600">
            {stats.totalIn}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">إجمالي المنصرف</TableCell>
          <TableCell className="text-red-600">
            {stats.totalOut}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">القيمة الإجمالية</TableCell>
          <TableCell>
            {stats.totalValue.toLocaleString()} جنيه
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">متوسط السعر</TableCell>
          <TableCell>
            {stats.averagePrice.toLocaleString()} جنيه
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">عدد الحركات</TableCell>
          <TableCell>{stats.movementCount}</TableCell>
        </TableRow>
        {stats.lastMovement && (
          <TableRow>
            <TableCell className="font-medium">آخر حركة</TableCell>
            <TableCell>
              {format(new Date(stats.lastMovement), "d MMMM yyyy", { locale: ar })}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
} 