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
import { NewProduct, Product } from "../types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProduct?: Product | null
}

export function AddProductDialog({ open, onOpenChange, editingProduct }: AddProductDialogProps) {
  const { addProduct, updateProduct, categories, units } = useInventory()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: editingProduct?.name || "",
    categoryId: editingProduct?.categoryId || "",
    description: editingProduct?.description || "",
    unitId: editingProduct?.unitId || "",
    price: editingProduct?.price || 0,
    quantity: editingProduct?.quantity || 0,
    minQuantity: editingProduct?.minQuantity || 0,
    expiryDate: editingProduct?.expiryDate || "",
    isPerishable: editingProduct?.isPerishable || false
  })

  // تحميل بيانات المنتج عند التعديل
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price,
        quantity: editingProduct.quantity,
        minQuantity: editingProduct.minQuantity || 0,
        unitId: editingProduct.unitId,
        categoryId: editingProduct.categoryId,
        expiryDate: editingProduct.expiryDate || "",
        isPerishable: editingProduct.isPerishable || false
      })
    }
  }, [editingProduct])

  const mainCategories = categories.filter(c => !c.isSubcategory)
  const subCategories = categories.filter(c => c.isSubcategory && c.parentId === formData.categoryId)

  useEffect(() => {
    if (!editingProduct) {
      setFormData({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        minQuantity: 0,
        unitId: "",
        categoryId: "",
        expiryDate: "",
        isPerishable: false
      })
    }
  }, [editingProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
      } else {
        await addProduct(formData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المنتج")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* الاسم */}
            <div className="space-y-2">
              <Label>اسم المنتج</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* التصنيف */}
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الوحدة */}
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={formData.unitId}
                onValueChange={(value) => setFormData({ ...formData, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* السعر */}
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>

            {/* الكمية */}
            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input
                type="number"
                min={0}
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>

            {/* الحد الأدنى للكمية */}
            <div className="space-y-2">
              <Label>الحد الأدنى للكمية</Label>
              <Input
                type="number"
                min={0}
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              />
            </div>

            {/* قابل للتلف */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id="isPerishable"
                  checked={formData.isPerishable}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isPerishable: checked as boolean })
                  }
                />
                <Label htmlFor="isPerishable">قابل للتلف</Label>
              </div>
            </div>

            {/* تاريخ الصلاحية */}
            {formData.isPerishable && (
              <div className="space-y-2">
                <Label>تاريخ الصلاحية</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : editingProduct ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
