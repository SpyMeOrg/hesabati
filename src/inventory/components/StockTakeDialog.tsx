import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInventory } from "../contexts/InventoryContext"
import { NewStockTake, StockTake, StockTakeItem } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface StockTakeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingStockTake?: StockTake | null
}

export function StockTakeDialog({ 
  open, 
  onOpenChange,
  editingStockTake 
}: StockTakeDialogProps) {
  const { products, addStockTake, updateStockTake, updateProduct } = useInventory()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [notes, setNotes] = useState(editingStockTake?.notes || "")
  const [items, setItems] = useState<Array<{
    productId: string
    productName: string
    price: number
    quantity: number
    currentQuantity: number
    difference: number
  }>>([])

  // تحديث القائمة عند تغيير المنتجات أو الجرد
  useEffect(() => {
    if (editingStockTake) {
      setItems(editingStockTake.items.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          currentQuantity: product?.quantity || 0,
          difference: item.quantity - (product?.quantity || 0)
        }
      }))
    } else {
      setItems(products.map(product => ({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: product.quantity,
        currentQuantity: product.quantity,
        difference: 0
      })))
    }
  }, [products, editingStockTake])

  const filteredItems = items.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleQuantityChange = (index: number, newQuantity: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const difference = newQuantity - item.currentQuantity
        return {
          ...item,
          quantity: newQuantity,
          difference
        }
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const stockTakeItems: StockTakeItem[] = items
        .filter(item => item.difference !== 0)
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity
        }))

      if (editingStockTake) {
        await updateStockTake(editingStockTake.id, {
          date: new Date().toISOString(),
          items: stockTakeItems,
          notes,
          status: 'completed',
          createdBy: 'admin'
        })
      } else {
        await addStockTake({
          date: new Date().toISOString(),
          items: stockTakeItems,
          notes,
          status: 'completed',
          createdBy: 'admin'
        })
      }

      // تحديث كميات المنتجات
      for (const item of items) {
        if (item.difference !== 0) {
          await updateProduct(item.productId, {
            quantity: item.quantity
          })
        }
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving stock take:', error)
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الجرد')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>جرد المخزون</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>بحث</Label>
            <Input
              placeholder="ابحث باسم المنتج"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              placeholder="أضف ملاحظات حول عملية الجرد"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الكمية الحالية</TableHead>
                  <TableHead className="text-right">الكمية الجديدة</TableHead>
                  <TableHead className="text-right">الفرق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item.productId}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.price.toLocaleString()} جنيه</TableCell>
                    <TableCell>{item.currentQuantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell className={item.difference < 0 ? "text-red-500" : item.difference > 0 ? "text-green-500" : ""}>
                      {item.difference > 0 ? "+" : ""}{item.difference}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      لا توجد منتجات مطابقة لبحثك
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !items.some(item => item.difference !== 0)}
            >
              {isLoading ? "جاري الحفظ..." : "حفظ الجرد"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
