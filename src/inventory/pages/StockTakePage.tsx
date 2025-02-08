import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InventoryMovementType } from "../types"
import { cn } from "@/lib/utils"
import { ProductStats } from "../components/ProductStats"

export function StockTakePage() {
  const { products, addMovement, getProductStats } = useInventory()
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [type, setType] = useState<InventoryMovementType>(InventoryMovementType.ADDITION)
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // حساب إحصائيات المنتج المحدد
  const selectedProductStats = useMemo(() => {
    if (!selectedProduct) return null
    try {
      return getProductStats(selectedProduct)
    } catch {
      return null
    }
  }, [selectedProduct, getProductStats])

  // تصفية المنتجات
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [products, searchTerm])

  // إضافة حركة جديدة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct || !quantity) {
      alert("الرجاء إدخال جميع البيانات المطلوبة")
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const quantityNum = Number(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert("الرجاء إدخال كمية صحيحة")
      return
    }

    // التحقق من الكمية المتاحة عند السحب
    if (type === InventoryMovementType.SUBTRACTION && quantityNum > product.quantity) {
      alert("الكمية المطلوبة غير متوفرة في المخزون")
      return
    }

    try {
      await addMovement({
        productId: selectedProduct,
        type,
        quantity: quantityNum,
        oldQuantity: product.quantity,
        newQuantity: type === InventoryMovementType.ADDITION 
          ? product.quantity + quantityNum 
          : product.quantity - quantityNum,
        price: product.price,
        userId: "admin", // يجب تغييرها لاحقاً مع نظام المستخدمين
        notes
      })

      // إعادة تعيين النموذج
      setSelectedProduct("")
      setQuantity("")
      setNotes("")
      alert("تم تسجيل الحركة بنجاح")
    } catch (error) {
      console.error("Error adding movement:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الحركة")
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">جرد المخزون</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* نموذج إضافة حركة */}
        <Card>
          <CardHeader>
            <CardTitle>تسجيل حركة مخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>المنتج</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="بحث عن منتج..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className={cn(
                          "p-2 cursor-pointer hover:bg-gray-100",
                          selectedProduct === product.id && "bg-primary/10"
                        )}
                        onClick={() => setSelectedProduct(product.id)}
                      >
                        {product.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>نوع الحركة</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={type === InventoryMovementType.ADDITION ? "default" : "outline"}
                    onClick={() => setType(InventoryMovementType.ADDITION)}
                  >
                    إضافة
                  </Button>
                  <Button
                    type="button"
                    variant={type === InventoryMovementType.SUBTRACTION ? "default" : "outline"}
                    onClick={() => setType(InventoryMovementType.SUBTRACTION)}
                  >
                    سحب
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="أدخل الكمية"
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل ملاحظات إضافية"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedProduct || !quantity}
              >
                تسجيل الحركة
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* تفاصيل المنتج المحدد */}
        {selectedProductStats && (
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المنتج</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductStats stats={selectedProductStats} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
