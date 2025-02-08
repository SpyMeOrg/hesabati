import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import { Product } from "../types"

interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
  const { deleteProduct } = useInventory()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!product) return

    try {
      setIsLoading(true)
      await deleteProduct(product.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting product:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حذف المنتج")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>حذف منتج</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            هل أنت متأكد من حذف المنتج "{product.name}"؟
          </p>
          {product.quantity > 0 && (
            <p className="text-red-600">
              تنبيه: هذا المنتج لديه كمية متبقية ({product.quantity}). حذف المنتج سيؤدي إلى فقدان هذه الكمية.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "جاري الحذف..." : "حذف"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
