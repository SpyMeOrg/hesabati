import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import { DeleteProductDialog } from "../components/DeleteProductDialog"
import { AddProductDialog } from "../components/AddProductDialog"
import { ExcelImportExport } from "../components/ExcelImportExport"
import { Product } from "../types"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function InventoryPage() {
  const { products, categories, units } = useInventory()
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // إحصائيات المخزون
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
  const lowStockProducts = products.filter(p => p.quantity <= (p.minQuantity || 0)).length
  const expiringProducts = products.filter(p => 
    p.isPerishable && 
    p.expiryDate && 
    new Date(p.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length

  // تصفية المنتجات
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(p.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setAddProductOpen(true)
  }

  // دالة مساعدة للحصول على اسم التصنيف
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || categoryId
  }

  // دالة مساعدة للحصول على اسم الوحدة
  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    return unit?.name || unitId
  }

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة المخزون</h1>
        <div className="flex gap-2">
          <ExcelImportExport />
          <Button onClick={() => setAddProductOpen(true)} className="bg-green-600 hover:bg-green-700">
            <i className="fas fa-plus ml-2"></i>
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="fas fa-box text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي المنتجات</p>
                <h3 className="text-2xl font-bold">{totalProducts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="fas fa-money-bill text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">قيمة المخزون</p>
                <h3 className="text-2xl font-bold">{totalValue.toLocaleString()} جنيه</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">منتجات قليلة</p>
                <h3 className="text-2xl font-bold">{lowStockProducts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <i className="fas fa-clock text-red-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">منتجات قاربت على الانتهاء</p>
                <h3 className="text-2xl font-bold">{expiringProducts}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المنتجات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>المنتجات</CardTitle>
          <div className="relative w-64">
            <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد منتجات"}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddProductOpen(true)}
                >
                  <i className="fas fa-plus ml-2"></i>
                  إضافة منتج
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 font-medium text-gray-500">الاسم</th>
                    <th className="py-3 px-4 font-medium text-gray-500">التصنيف</th>
                    <th className="py-3 px-4 font-medium text-gray-500">الوحدة</th>
                    <th className="py-3 px-4 font-medium text-gray-500">السعر</th>
                    <th className="py-3 px-4 font-medium text-gray-500">الكمية</th>
                    <th className="py-3 px-4 font-medium text-gray-500">الحد الأدنى</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">تاريخ الإضافة</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4">{getCategoryName(product.categoryId)}</td>
                      <td className="py-3 px-4">{getUnitName(product.unitId)}</td>
                      <td className="py-3 px-4">{product.price.toLocaleString()} جنيه</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-sm",
                          product.quantity <= (product.minQuantity || 0)
                            ? "bg-red-100 text-red-700"
                            : product.quantity <= (product.minQuantity || 0) * 1.5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        )}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {product.minQuantity ? product.minQuantity.toLocaleString() : "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {format(new Date(product.createdAt), "d MMMM yyyy", { locale: ar })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditProduct(product)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نوافذ الحوار */}
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null)
          }
          setAddProductOpen(open)
        }}
        editingProduct={editingProduct}
      />

      <DeleteProductDialog
        open={!!deletingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingProduct(null)
          }
        }}
        product={deletingProduct}
      />
    </div>
  )
}
