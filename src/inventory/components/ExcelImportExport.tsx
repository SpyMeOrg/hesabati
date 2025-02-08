import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from "@/components/ui/button"
import { useInventory } from '../contexts/InventoryContext'
import { ExcelProduct, NewProduct } from '../types'
import { toast } from 'sonner'
import { FileUp, FileDown } from "lucide-react"

export function ExcelImportExport() {
  const { products, categories, units, addProduct } = useInventory()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // تحويل البيانات إلى تنسيق Excel
      const excelData: ExcelProduct[] = products.map(product => {
        const category = categories.find(c => c.id === product.categoryId)
        const unit = units.find(u => u.id === product.unitId)

        return {
          الاسم: product.name,
          التصنيف: category?.name || "",
          الوصف: product.description || "",
          الوحدة: unit?.name || "",
          السعر: product.price,
          الكمية: product.quantity,
          'الحد الأدنى للكمية': product.minQuantity,
          'تاريخ الصلاحية': product.expiryDate,
          'قابل للتلف': product.isPerishable
        }
      })

      // إنشاء ملف Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات")

      // تحميل الملف
      XLSX.writeFile(workbook, `inventory_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("حدث خطأ أثناء تصدير البيانات")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImporting(true)
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const excelProducts: ExcelProduct[] = XLSX.utils.sheet_to_json(worksheet)

          // إضافة المنتجات
          for (const excelProduct of excelProducts) {
            const category = categories.find(c => c.name === excelProduct.التصنيف)
            const unit = units.find(u => u.name === excelProduct.الوحدة)

            if (!category || !unit) {
              toast.error(`لم يتم العثور على التصنيف أو الوحدة للمنتج: ${excelProduct.الاسم}`)
              continue
            }

            const product: NewProduct = {
              name: excelProduct.الاسم,
              categoryId: category.id,
              description: excelProduct.الوصف,
              unitId: unit.id,
              price: excelProduct.السعر,
              quantity: excelProduct.الكمية,
              minQuantity: excelProduct['الحد الأدنى للكمية'],
              expiryDate: excelProduct['تاريخ الصلاحية'],
              isPerishable: excelProduct['قابل للتلف']
            }

            await addProduct(product)
          }

          toast.success('تم استيراد المنتجات بنجاح')
          event.target.value = '' // إعادة تعيين حقل الملف
        } catch (error) {
          console.error('Error processing Excel file:', error)
          toast.error('حدث خطأ أثناء معالجة ملف Excel')
        }
      }

      reader.readAsBinaryString(file)
    } catch (error) {
      console.error('Error importing products:', error)
      toast.error('حدث خطأ أثناء استيراد المنتجات')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex gap-4" dir="rtl">
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isExporting}
      >
        <FileDown className="h-4 w-4 ml-2" />
        {isExporting ? "جاري التصدير..." : "تصدير Excel"}
      </Button>

      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isImporting}
        />
        <Button
          variant="outline"
          className="flex items-center gap-2"
          disabled={isImporting}
        >
          <FileUp className="h-4 w-4 ml-2" />
          {isImporting ? 'جاري الاستيراد...' : 'استيراد من Excel'}
        </Button>
      </div>
    </div>
  )
} 