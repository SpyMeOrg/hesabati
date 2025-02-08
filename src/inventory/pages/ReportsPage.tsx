import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ar } from "date-fns/locale"
import { useInventory } from "../contexts/InventoryContext"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileDown, Filter } from "lucide-react"
import { InventoryMovementsTable } from "../components/InventoryMovementsTable"
import { ProductStats } from "../components/ProductStats"
import { ExcelImportExport } from "../components/ExcelImportExport"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function ReportsPage() {
  const { products, categories, units, movements, getProductStats } = useInventory()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [reportType, setReportType] = useState<string>("daily")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [activeTab, setActiveTab] = useState("overview")

  // حساب إحصائيات المخزون
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const lowStockProducts = products.filter(p => p.quantity <= (p.minQuantity || 0)).length
    const expiringProducts = products.filter(p => 
      p.isPerishable && 
      p.expiryDate && 
      new Date(p.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      expiringProducts
    }
  }, [products])

  // حساب المنتجات الأكثر والأقل حركة
  const movementStats = useMemo(() => {
    const productStats = products.map(product => getProductStats(product.id))
    const sortedStats = [...productStats].sort((a, b) => b.movementCount - a.movementCount)
    
    return {
      topMoving: sortedStats.slice(0, 5),
      leastMoving: sortedStats.slice(-5).reverse()
    }
  }, [products, getProductStats])

  // حساب بيانات الرسوم البيانية
  const chartData = useMemo(() => {
    // توزيع قيمة المخزون حسب التصنيفات
    const categoryDistribution = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id)
      const value = categoryProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
      return {
        name: category.name,
        value
      }
    }).filter(item => item.value > 0)

    // حركة المنتجات الشهرية
    const monthlyMovements = Array.from({ length: 5 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthMovements = movements.filter(m => 
        new Date(m.createdAt).getMonth() === date.getMonth() &&
        new Date(m.createdAt).getFullYear() === date.getFullYear()
      )

      return {
        name: format(date, "MMMM", { locale: ar }),
        حركة: monthMovements.length,
        قيمة: monthMovements.reduce((sum, m) => sum + (m.price * m.quantity), 0)
      }
    }).reverse()

    return {
      categoryDistribution,
      monthlyMovements
    }
  }, [categories, products, movements])

  // تصفية الحركات حسب التاريخ
  const filteredMovements = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return movements

    return movements.filter(movement => {
      const moveDate = new Date(movement.createdAt)
      return moveDate >= dateRange.from! && moveDate <= dateRange.to!
    })
  }, [movements, dateRange])

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">التقارير والإحصائيات</h2>
        <div className="flex items-center gap-4">
          <div className="min-w-[250px]">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
              placeholder="اختر نطاق التاريخ"
          />
          </div>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="نوع التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <ExcelImportExport />
        </div>
      </div>

      {/* التقرير */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير المخزون</CardTitle>
          {dateRange?.from && dateRange?.to && (
            <div className="text-sm text-gray-500">
              {format(dateRange.from, "d MMMM yyyy", { locale: ar })} - 
              {format(dateRange.to, "d MMMM yyyy", { locale: ar })}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="top-products">الأكثر حركة</TabsTrigger>
              <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
              <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            </TabsList>

            {/* نظرة عامة */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{inventoryStats.totalProducts}</div>
                    <div className="text-sm text-gray-500">إجمالي المنتجات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">
                      {inventoryStats.totalValue.toLocaleString()} جنيه
                    </div>
                    <div className="text-sm text-gray-500">قيمة المخزون</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-500">
                      {inventoryStats.lowStockProducts}
                    </div>
                    <div className="text-sm text-gray-500">منتجات تحت الحد الأدنى</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-500">
                      {inventoryStats.expiringProducts}
                    </div>
                    <div className="text-sm text-gray-500">منتجات قاربت على الانتهاء</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* المنتجات الأكثر حركة */}
            <TabsContent value="top-products">
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">المنتجات الأكثر حركة</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movementStats.topMoving.map((stats) => (
                      <Card key={stats.productId}>
                        <CardContent className="pt-4">
                          <ProductStats stats={stats} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">المنتجات الأقل حركة</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movementStats.leastMoving.map((stats) => (
                      <Card key={stats.productId}>
                        <CardContent className="pt-4">
                          <ProductStats stats={stats} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* الرسوم البيانية */}
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>حركة المنتجات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.monthlyMovements}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="حركة" fill="#8884d8" />
                          <Bar dataKey="قيمة" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>توزيع قيمة المخزون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.categoryDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            label
                          >
                            {chartData.categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* التنبيهات */}
            <TabsContent value="alerts">
              <div className="space-y-4">
                {inventoryStats.lowStockProducts > 0 && (
                  <Card className="border-yellow-500">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-yellow-500 mb-2">
                        منتجات تحت الحد الأدنى ({inventoryStats.lowStockProducts})
                      </h3>
                      <p className="text-sm text-gray-500">
                        يوجد {inventoryStats.lowStockProducts} منتجات تحتاج إلى إعادة الطلب
                      </p>
                    </CardContent>
                  </Card>
                )}

                {inventoryStats.expiringProducts > 0 && (
                  <Card className="border-red-500">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-red-500 mb-2">
                        منتجات قاربت على الانتهاء ({inventoryStats.expiringProducts})
                      </h3>
                      <p className="text-sm text-gray-500">
                        يوجد {inventoryStats.expiringProducts} منتجات ستنتهي صلاحيتها قريباً
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* حركة المخزون */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>حركة المخزون</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryMovementsTable movements={filteredMovements} />
        </CardContent>
      </Card>
    </div>
  )
} 