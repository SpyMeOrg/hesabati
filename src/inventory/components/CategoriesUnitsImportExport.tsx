import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import type { Category, Unit } from "../types"
import * as XLSX from 'xlsx'
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

export function CategoriesUnitsImportExport() {
  const { categories, units, addCategory, addUnit } = useInventory()
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    try {
      // تجهيز البيانات للتصدير
      const categoriesData = categories.map((cat: Category) => {
        const isSubcategory = cat.parentId !== undefined && cat.parentId !== null
        const parentCategory = isSubcategory ? categories.find(c => c.id === cat.parentId) : null
        
        return {
          'نوع التصنيف': isSubcategory ? 'فرعي' : 'رئيسي',
          'التصنيف الرئيسي': isSubcategory ? (parentCategory?.name || '') : '-',
          'اسم التصنيف': cat.name,
          'الوصف': cat.description || '',
          'تاريخ الإضافة': new Date(cat.createdAt).toLocaleDateString('ar-EG')
        }
      })

      console.log('Categories data for export:', categoriesData)

      const unitsData = units.map((unit: Unit) => ({
        'اسم الوحدة': unit.name,
        'الرمز': unit.symbol || '',
        'تاريخ الإضافة': new Date(unit.createdAt).toLocaleDateString('ar-EG')
      }))

      const wb = XLSX.utils.book_new()
      
      // إضافة ورقة التصنيفات مع تفعيل RTL
      const wsCategories = XLSX.utils.json_to_sheet(categoriesData)
      wsCategories['!RTL'] = true
      XLSX.utils.book_append_sheet(wb, wsCategories, "التصنيفات")
      
      // إضافة ورقة الوحدات مع تفعيل RTL
      const wsUnits = XLSX.utils.json_to_sheet(unitsData)
      wsUnits['!RTL'] = true
      XLSX.utils.book_append_sheet(wb, wsUnits, "الوحدات")

      // تعديل عرض الأعمدة
      const setCellWidth = (worksheet: XLSX.WorkSheet) => {
        const columnWidths = []
        for (let i = 0; i < 10; i++) {
          columnWidths.push({ wch: 20 })
        }
        worksheet['!cols'] = columnWidths
      }

      setCellWidth(wsCategories)
      setCellWidth(wsUnits)
      
      // حفظ الملف
      XLSX.writeFile(wb, "التصنيفات-والوحدات.xlsx")
    } catch (error) {
      console.error('Error during export:', error)
      setError('حدث خطأ أثناء تصدير البيانات')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      
      // استيراد التصنيفات
      const categoriesSheet = workbook.Sheets["التصنيفات"]
      if (categoriesSheet) {
        const categoriesData = XLSX.utils.sheet_to_json<any>(categoriesSheet)
        console.log('Imported categories data:', categoriesData)
        
        // أولاً: إضافة التصنيفات الرئيسية وتخزين معرفاتها
        const mainCategoriesMap = new Map<string, string>()
        
        // إضافة التصنيفات الرئيسية
        for (const row of categoriesData.filter(r => r['نوع التصنيف'] === 'رئيسي')) {
          try {
            console.log('Adding main category:', row)
            const newCategory = {
              name: row['اسم التصنيف'],
              description: row['الوصف'] || undefined,
              isSubcategory: false,
              parentId: undefined
            }

            await addCategory(newCategory)
            
            // البحث عن التصنيف المضاف في قائمة التصنيفات المحدثة
            const addedCategory = categories.find(c => 
              c.name === row['اسم التصنيف'] && !c.isSubcategory
            )
            
            if (addedCategory) {
              mainCategoriesMap.set(row['اسم التصنيف'], addedCategory.id)
              console.log('Main category mapped:', row['اسم التصنيف'], '->', addedCategory.id)
            } else {
              console.error('Could not find added main category:', row['اسم التصنيف'])
            }
          } catch (error) {
            console.error('Error adding main category:', row['اسم التصنيف'], error)
          }
        }

        // إضافة التصنيفات الفرعية
        const subcategories = categoriesData.filter(r => r['نوع التصنيف'] === 'فرعي')
        console.log('Subcategories to add:', subcategories)
        
        for (const row of subcategories) {
          const parentName = row['التصنيف الرئيسي']
          const parentId = mainCategoriesMap.get(parentName)
          
          if (!parentId) {
            console.error('Parent category not found:', parentName, 'for subcategory:', row['اسم التصنيف'])
            continue
          }

          try {
            console.log('Adding subcategory:', row['اسم التصنيف'], 'under parent:', parentName)
            const newCategory = {
              name: row['اسم التصنيف'],
              description: row['الوصف'] || undefined,
              isSubcategory: true,
              parentId: parentId
            }

            await addCategory(newCategory)
            console.log('Successfully added subcategory:', row['اسم التصنيف'])
          } catch (error) {
            console.error('Error adding subcategory:', row['اسم التصنيف'], error)
          }
        }
      }

      // استيراد الوحدات
      const unitsSheet = workbook.Sheets["الوحدات"]
      if (unitsSheet) {
        const unitsData = XLSX.utils.sheet_to_json<any>(unitsSheet)
        console.log('Imported units data:', unitsData)
        
        for (const row of unitsData) {
          try {
            const newUnit = {
              name: row['اسم الوحدة'],
              symbol: row['الرمز'] || undefined
            }

            await addUnit(newUnit)
          } catch (error) {
            console.error('Error adding unit:', row['اسم الوحدة'], error)
          }
        }
      }

      // تنظيف حقل الملف
      event.target.value = ''
      setError(null)
    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات")
    }
  }

  return (
    <div className="flex items-center gap-4" dir="rtl">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button
        variant="outline"
        onClick={handleExport}
        className="bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 flex items-center gap-2"
      >
        <i className="fas fa-file-export"></i>
        تصدير إلى Excel
      </Button>

      <div className="relative">
        <Button
          variant="outline"
          onClick={() => document.getElementById('import-file')?.click()}
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <i className="fas fa-file-import"></i>
          استيراد من Excel
        </Button>
        <input
          type="file"
          id="import-file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleImport}
        />
      </div>
    </div>
  )
}
