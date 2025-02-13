import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ProductMovement } from "../types"
import { useAuth } from "@/contexts/AuthContext"

type ProductMovementsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  movements: ProductMovement[]
  productName: string
}

export function ProductMovementsDialog({
  open,
  onOpenChange,
  movements,
  productName
}: ProductMovementsDialogProps) {
  const { users } = useAuth()

  // تحويل نوع الحركة إلى نص عربي
  const getMovementTypeText = (type: ProductMovement['type']) => {
    switch (type) {
      case 'edit':
        return 'تعديل'
      case 'stock':
        return 'حركة مخزون'
      case 'delete':
        return 'حذف'
      default:
        return type
    }
  }

  // تنسيق وصف الحركة
  const formatMovementDescription = (movement: ProductMovement) => {
    if (movement.type === 'edit' && movement.oldValue && movement.newValue) {
      return `${movement.description} من ${movement.oldValue} إلى ${movement.newValue}`
    }
    if (movement.type === 'stock' && movement.quantity) {
      const sign = movement.quantity > 0 ? 'إضافة' : 'خصم'
      return `${sign} ${Math.abs(movement.quantity)} ${movement.description}`
    }
    return movement.description
  }

  // الحصول على اسم المستخدم
  const getUserName = (userId: string) => {
    const user = users?.find(u => u.id === userId)
    return user?.username || userId
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>سجل حركات المنتج: {productName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead>نوع الحركة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>المستخدم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    لا توجد حركات لهذا المنتج
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {format(new Date(movement.createdAt), "d MMMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>{getMovementTypeText(movement.type)}</TableCell>
                    <TableCell>{formatMovementDescription(movement)}</TableCell>
                    <TableCell>{getUserName(movement.userId)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
