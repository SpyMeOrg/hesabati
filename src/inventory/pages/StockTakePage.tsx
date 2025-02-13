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
import { useAuth } from "@/contexts/AuthContext"

export function StockTakePage() {
  const { products, addMovement, getProductStats } = useInventory()
  const { user } = useAuth()
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

  // معالجة تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity || !user) return

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const numericQuantity = Number(quantity)
    const oldQuantity = product.quantity
    const newQuantity = type === InventoryMovementType.ADDITION
      ? oldQuantity + numericQuantity
      : oldQuantity - numericQuantity

    try {
      await addMovement({
        productId: selectedProduct,
        type,
        quantity: numericQuantity,
        oldQuantity,
        newQuantity,
        price: product.price,
        userId: user.id,
        notes
      })

      // إعادة تعيين النموذج
      setQuantity("")
      setNotes("")
      setType(InventoryMovementType.ADDITION)
    } catch (error) {
      console.error("Error adding movement:", error)
      alert("حدث خطأ أثناء تسجيل الحركة")
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">جرد المخزون</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* قائمة المنتجات */}
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle>المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="بحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="h-[60vh] overflow-y-auto">
                <Table>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted transition-colors",
                          selectedProduct === product.id && "bg-muted"
                        )}
                        onClick={() => setSelectedProduct(product.id)}
                      >
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نموذج إضافة حركة */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>تسجيل حركة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedProductStats && (
                <ProductStats stats={selectedProductStats} />
              )}

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
                disabled={!selectedProduct || !quantity || !user}
              >
                تسجيل الحركة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
