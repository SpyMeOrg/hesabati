import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import type { Category, Unit } from "../types"
import * as XLSX from 'xlsx'

export function CategoriesUnitsImportExport() {
  const { categories, units, addCategory, addUnit } = useInventory()

  const handleExport = () => {
    // تجهيز البيانات للتصدير
    const categoriesData = categories.map((cat: Category) => {
      // تحديد نوع التصنيف (رئيسي/فرعي)
      const isMain = !cat.parentId
      return {
        'نوع التصنيف': isMain ? 'رئيسي' : 'فرعي',
        'التصنيف الرئيسي': isMain ? '-' : categories.find(c => c.id === cat.parentId)?.name || '',
        'اسم التصنيف': cat.name,
        'الوصف': cat.description || '',
        'تاريخ الإضافة': new Date(cat.createdAt).toLocaleDateString('ar-EG')
      }
    })

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
        columnWidths.push({ wch: 20 }) // عرض كل عمود 20 حرف
      }
      worksheet['!cols'] = columnWidths
    }

    setCellWidth(wsCategories)
    setCellWidth(wsUnits)
    
    // حفظ الملف
    XLSX.writeFile(wb, "التصنيفات-والوحدات.xlsx")
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
        
        // أولاً: إضافة التصنيفات الرئيسية
        const mainCategories = categoriesData.filter(row => row['نوع التصنيف'] === 'رئيسي')
        const mainCategoriesMap = new Map<string, string>() // لتخزين العلاقة بين اسم التصنيف الرئيسي والمعرف الخاص به

        for (const row of mainCategories) {
          const newCategory = {
            name: row['اسم التصنيف'],
            description: row['الوصف'] || undefined,
            parentId: undefined,
            isSubcategory: false
          }

          try {
            await addCategory(newCategory)
            // نبحث عن التصنيف المضاف في قائمة التصنيفات
            const addedCategory = categories.find(c => c.name === row['اسم التصنيف'] && !c.isSubcategory)
            if (addedCategory) {
              mainCategoriesMap.set(row['اسم التصنيف'], addedCategory.id)
            }
          } catch (error) {
            console.error('خطأ في إضافة التصنيف الرئيسي:', error)
          }
        }

        // ثانياً: إضافة التصنيفات الفرعية
        const subCategories = categoriesData.filter(row => row['نوع التصنيف'] !== 'رئيسي')
        for (const row of subCategories) {
          const parentName = row['التصنيف الرئيسي']
          const parentId = mainCategoriesMap.get(parentName)
          
          if (!parentId) {
            console.error(`لم يتم العثور على التصنيف الرئيسي: ${parentName}`)
            continue
          }

          const newCategory = {
            name: row['اسم التصنيف'],
            description: row['الوصف'] || undefined,
            parentId: parentId,
            isSubcategory: true
          }

          try {
            await addCategory(newCategory)
          } catch (error) {
            console.error('خطأ في إضافة التصنيف الفرعي:', error)
          }
        }
      }

      // استيراد الوحدات
      const unitsSheet = workbook.Sheets["الوحدات"]
      if (unitsSheet) {
        const unitsData = XLSX.utils.sheet_to_json<any>(unitsSheet)
        for (const row of unitsData) {
          const newUnit = {
            name: row['اسم الوحدة'],
            symbol: row['الرمز'] || undefined
          }

          try {
            await addUnit(newUnit)
          } catch (error) {
            console.error('خطأ في إضافة الوحدة:', error)
          }
        }
      }

      // تنظيف حقل الملف
      event.target.value = ''
      alert('تم استيراد البيانات بنجاح')
    } catch (error) {
      console.error('خطأ في استيراد الملف:', error)
      alert('حدث خطأ أثناء استيراد الملف')
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
        className="bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700"
      >
        <i className="fas fa-file-export ml-2"></i>
        تصدير إلى Excel
      </Button>

      <Button
        variant="outline"
        onClick={() => document.getElementById('import-file')?.click()}
        className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
      >
        <i className="fas fa-file-import ml-2"></i>
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
  )
}
