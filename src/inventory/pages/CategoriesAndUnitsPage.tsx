import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import { CategoryDialog } from "../components/CategoryDialog"
import { UnitDialog } from "../components/UnitDialog"
import { Category, Unit } from "../types"
import { cn } from "@/lib/utils"

export function CategoriesAndUnitsPage() {
  const { categories, units, deleteCategory, deleteUnit, addCategory, updateCategory, addUnit, updateUnit } = useInventory()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  // تصفية التصنيفات الرئيسية
  const mainCategories = categories.filter(c => !c.isSubcategory)

  // الحصول على التصنيفات الفرعية لتصنيف معين
  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.isSubcategory && c.parentId === parentId)
  }

  // التحقق من وجود تصنيفات فرعية
  const hasSubCategories = (categoryId: string) => {
    return categories.some(c => c.isSubcategory && c.parentId === categoryId)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setAddCategoryOpen(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التصنيف؟")) {
      try {
        await deleteCategory(categoryId)
      } catch (error) {
        console.error("Error deleting category:", error)
        alert(error instanceof Error ? error.message : "حدث خطأ أثناء حذف التصنيف")
      }
    }
  }

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setAddUnitOpen(true)
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الوحدة؟")) {
      try {
        await deleteUnit(unitId)
      } catch (error) {
        console.error("Error deleting unit:", error)
        alert(error instanceof Error ? error.message : "حدث خطأ أثناء حذف الوحدة")
      }
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">التصنيفات والوحدات</h1>
        <div className="flex gap-2">
          <Button onClick={() => setAddCategoryOpen(true)}>
            <i className="fas fa-plus ml-2"></i>
            إضافة تصنيف
          </Button>
          <Button onClick={() => setAddUnitOpen(true)}>
            <i className="fas fa-plus ml-2"></i>
            إضافة وحدة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* التصنيفات */}
        <Card className="col-span-6">
          <CardHeader>
            <CardTitle>التصنيفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mainCategories.length === 0 ? (
                <p className="text-center text-gray-500">لا توجد تصنيفات</p>
              ) : (
                mainCategories.map(category => (
                  <div key={category.id} className="border rounded-lg p-3 transition-all duration-200 hover:border-primary">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "p-1 h-6 w-6 transition-transform duration-200 hover:bg-gray-100",
                            expandedCategories.has(category.id) ? "rotate-90" : "",
                            hasSubCategories(category.id) ? "visible cursor-pointer" : "invisible"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category.id);
                          }}
                        >
                          <i className="fas fa-chevron-left text-xs"></i>
                        </Button>
                        <div 
                          className={cn(
                            "flex-1 flex items-center gap-2",
                            hasSubCategories(category.id) && "cursor-pointer"
                          )}
                          onClick={() => hasSubCategories(category.id) && toggleCategory(category.id)}
                        >
                          <span className="font-medium">{category.name}</span>
                          {category.description && (
                            <span className="text-sm text-gray-500">- {category.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(category);
                          }}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </Button>
                      </div>
                    </div>

                    {hasSubCategories(category.id) && (
                      <div className={cn(
                        "mr-6 mt-2 space-y-2 border-r pr-4 overflow-hidden transition-all duration-200",
                        expandedCategories.has(category.id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      )}>
                        {getSubCategories(category.id).map(subCategory => (
                          <div key={subCategory.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50">
                            <div>
                              <span>{subCategory.name}</span>
                              {subCategory.description && (
                                <span className="text-sm text-gray-500 mr-2">- {subCategory.description}</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                                onClick={() => handleEditCategory(subCategory)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                onClick={() => handleDeleteCategory(subCategory.id)}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* الوحدات */}
        <Card className="col-span-6">
          <CardHeader>
            <CardTitle>الوحدات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {units.length === 0 ? (
                <p className="text-center text-gray-500">لا توجد وحدات</p>
              ) : (
                units.map(unit => (
                  <div key={unit.id} className="border rounded-lg p-3 transition-all duration-200 hover:border-primary">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{unit.name}</span>
                        {unit.symbol && (
                          <span className="text-sm text-gray-500">({unit.symbol})</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                          onClick={() => handleEditUnit(unit)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة حوار التصنيف */}
      <CategoryDialog
        open={addCategoryOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCategory(null)
          }
          setAddCategoryOpen(open)
        }}
        editingCategory={editingCategory}
        mainCategories={mainCategories}
        onSave={async (category) => {
          try {
            if (editingCategory) {
              await updateCategory(editingCategory.id, category)
            } else {
              await addCategory(category)
            }
          } catch (error) {
            console.error("Error saving category:", error)
            throw error
          }
        }}
      />

      {/* نافذة حوار الوحدة */}
      <UnitDialog
        open={addUnitOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUnit(null)
          }
          setAddUnitOpen(open)
        }}
        editingUnit={editingUnit}
        onSave={async (unit) => {
          try {
            if (editingUnit) {
              await updateUnit(editingUnit.id, unit)
            } else {
              await addUnit(unit)
            }
          } catch (error) {
            console.error("Error saving unit:", error)
            throw error
          }
        }}
      />
    </div>
  )
}
