import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ProductStats, InventoryReport } from "../types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface InventoryReportsProps {
  report: InventoryReport
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function InventoryReports({ report }: InventoryReportsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // تحويل البيانات للرسوم البيانية
  const productMovementData = report.topMovingProducts.map(product => ({
    name: product.productName,
    حركة: product.movementCount,
    قيمة: product.totalValue
  }))

  const stockDistributionData = report.topMovingProducts.map(product => ({
    name: product.productName,
    value: product.totalValue
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقرير المخزون</CardTitle>
        <div className="text-sm text-gray-500">
          {format(new Date(report.startDate), "d MMMM yyyy", { locale: ar })} - 
          {format(new Date(report.endDate), "d MMMM yyyy", { locale: ar })}
        </div>
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
                  <div className="text-2xl font-bold">{report.totalProducts}</div>
                  <div className="text-sm text-gray-500">إجمالي المنتجات</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{report.totalValue.toLocaleString()} جنيه</div>
                  <div className="text-sm text-gray-500">قيمة المخزون</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-yellow-500">{report.lowStockProducts}</div>
                  <div className="text-sm text-gray-500">منتجات تحت الحد الأدنى</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-red-500">{report.expiringProducts}</div>
                  <div className="text-sm text-gray-500">منتجات قاربت على الانتهاء</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* المنتجات الأكثر حركة */}
          <TabsContent value="top-products">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">المنتجات الأكثر حركة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
                      <TableHead>إجمالي الوارد</TableHead>
                      <TableHead>إجمالي المنصرف</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>عدد الحركات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topMovingProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.currentStock}</TableCell>
                        <TableCell>{product.totalIn}</TableCell>
                        <TableCell>{product.totalOut}</TableCell>
                        <TableCell>{product.totalValue.toLocaleString()} جنيه</TableCell>
                        <TableCell>{product.movementCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">المنتجات الأقل حركة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
                      <TableHead>إجمالي الوارد</TableHead>
                      <TableHead>إجمالي المنصرف</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>عدد الحركات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.leastMovingProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.currentStock}</TableCell>
                        <TableCell>{product.totalIn}</TableCell>
                        <TableCell>{product.totalOut}</TableCell>
                        <TableCell>{product.totalValue.toLocaleString()} جنيه</TableCell>
                        <TableCell>{product.movementCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* الرسوم البيانية */}
          <TabsContent value="charts">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">حركة المنتجات</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productMovementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="حركة" fill="#8884d8" />
                      <Bar dataKey="قيمة" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">توزيع قيمة المخزون</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label
                      >
                        {stockDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* التنبيهات */}
          <TabsContent value="alerts">
            <div className="space-y-4">
              {report.lowStockProducts > 0 && (
                <Card className="border-yellow-500">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-yellow-500 mb-2">
                      منتجات تحت الحد الأدنى ({report.lowStockProducts})
                    </h3>
                    <p className="text-sm text-gray-500">
                      يوجد {report.lowStockProducts} منتجات تحتاج إلى إعادة الطلب
                    </p>
                  </CardContent>
                </Card>
              )}

              {report.expiringProducts > 0 && (
                <Card className="border-red-500">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-red-500 mb-2">
                      منتجات قاربت على الانتهاء ({report.expiringProducts})
                    </h3>
                    <p className="text-sm text-gray-500">
                      يوجد {report.expiringProducts} منتجات ستنتهي صلاحيتها قريباً
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 