import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInventory } from "../contexts/InventoryContext"
import { CategoryDialog } from "../components/CategoryDialog"
import { UnitDialog } from "../components/UnitDialog"
import { CategoriesUnitsImportExport } from "../components/CategoriesUnitsImportExport"
import { Category, Unit, Product } from "../types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditCategoriesListDialog } from "../components/EditCategoriesListDialog"
import { EditUnitsListDialog } from "../components/EditUnitsListDialog"

export function CategoriesAndUnitsPage() {
  const { categories, units, products, deleteCategory, deleteUnit, addCategory, updateCategory, addUnit, updateUnit } = useInventory()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [editCategoriesListOpen, setEditCategoriesListOpen] = useState(false)
  const [editUnitsListOpen, setEditUnitsListOpen] = useState(false)

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
    const hasLinkedProducts = products.some(p => p.categoryId === categoryId)
    const message = hasLinkedProducts 
      ? "هذا التصنيف مرتبط بمنتجات. هل أنت متأكد من حذفه؟"
      : "هل أنت متأكد من حذف هذا التصنيف؟"

    if (window.confirm(message)) {
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
    const hasLinkedProducts = products.some(p => p.unitId === unitId)
    const message = hasLinkedProducts 
      ? "هذه الوحدة مرتبطة بمنتجات. هل أنت متأكد من حذفها؟"
      : "هل أنت متأكد من حذف هذه الوحدة؟"

    if (window.confirm(message)) {
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
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">التصنيفات والوحدات</h1>
          <div className="flex gap-4">
            <CategoriesUnitsImportExport />
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
              <div className="flex items-center justify-between">
                <CardTitle>التصنيفات</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                    onClick={() => setEditCategoriesListOpen(true)}
                    title="تعديل قائمة التصنيفات"
                  >
                    <i className="fas fa-list-ul"></i>
                    تعديل القائمة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (window.confirm('هل أنت متأكد من مسح جميع التصنيفات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                        try {
                          // التحقق من التصنيفات التي يمكن حذفها
                          const categoriesToDelete = categories.filter(category => {
                            const hasProducts = products.some(p => p.categoryId === category.id);
                            const hasSubCategories = categories.some(c => c.parentId === category.id);
                            return !hasProducts && !hasSubCategories;
                          });

                          if (categoriesToDelete.length === 0) {
                            alert('لا يمكن حذف أي تصنيف لأن جميع التصنيفات إما مرتبطة بمنتجات أو لديها تصنيفات فرعية');
                            return;
                          }

                          if (categoriesToDelete.length < categories.length) {
                            const cannotDeleteCount = categories.length - categoriesToDelete.length;
                            if (!window.confirm(`سيتم حذف ${categoriesToDelete.length} تصنيف فقط. ${cannotDeleteCount} تصنيف لا يمكن حذفه لارتباطه بمنتجات أو وجود تصنيفات فرعية. هل تريد المتابعة؟`)) {
                              return;
                            }
                          }

                          // حذف التصنيفات التي يمكن حذفها
                          await Promise.all(categoriesToDelete.map(category => deleteCategory(category.id)));
                          alert(`تم حذف ${categoriesToDelete.length} تصنيف بنجاح`);
                        } catch (error) {
                          console.error('خطأ في مسح التصنيفات:', error);
                          alert('حدث خطأ أثناء مسح التصنيفات');
                        }
                      }
                    }}
                    title="مسح جميع التصنيفات"
                  >
                    <i className="fas fa-trash-alt"></i>
                    مسح الكل
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mainCategories.length === 0 ? (
                  <p className="text-center text-gray-500">لا توجد تصنيفات</p>
                ) : (
                  mainCategories.map(category => (
                    <div key={category.id} className="border rounded-lg p-3 transition-all duration-200 hover:border-primary">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                          <i className={`fas fa-chevron-${expandedCategories.has(category.id) ? 'down' : 'left'} text-gray-500`}></i>
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                            <span className="text-sm text-gray-500">({category.description})</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCategory(category)
                            }}
                            title="تعديل التصنيف"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                        </div>
                      </div>

                      {expandedCategories.has(category.id) && (
                        <div className="mt-2 pr-6 space-y-2">
                          {getSubCategories(category.id).map(subCategory => (
                            <div key={subCategory.id} className="border rounded-lg p-2 transition-all duration-200 hover:border-primary">
                              <div className="flex items-center justify-between gap-2">
                                <span>{subCategory.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEditCategory(subCategory)}
                                  title="تعديل التصنيف الفرعي"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                </div>
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
              <div className="flex items-center justify-between">
                <CardTitle>الوحدات</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                    onClick={() => setEditUnitsListOpen(true)}
                    title="تعديل قائمة الوحدات"
                  >
                    <i className="fas fa-list-ul"></i>
                    تعديل القائمة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (window.confirm('هل أنت متأكد من مسح جميع الوحدات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                        try {
                          // التحقق من الوحدات التي يمكن حذفها
                          const unitsToDelete = units.filter(unit => !products.some(p => p.unitId === unit.id));
                          
                          if (unitsToDelete.length === 0) {
                            alert('لا يمكن حذف أي وحدة لأن جميع الوحدات مرتبطة بمنتجات');
                            return;
                          }

                          if (unitsToDelete.length < units.length) {
                            const cannotDeleteCount = units.length - unitsToDelete.length;
                            if (!window.confirm(`سيتم حذف ${unitsToDelete.length} وحدة فقط. ${cannotDeleteCount} وحدة لا يمكن حذفها لارتباطها بمنتجات. هل تريد المتابعة؟`)) {
                              return;
                            }
                          }

                          // حذف الوحدات التي يمكن حذفها
                          await Promise.all(unitsToDelete.map(unit => deleteUnit(unit.id)));
                          alert(`تم حذف ${unitsToDelete.length} وحدة بنجاح`);
                        } catch (error) {
                          console.error('خطأ في مسح الوحدات:', error);
                          alert('حدث خطأ أثناء مسح الوحدات');
                        }
                      }
                    }}
                    title="مسح جميع الوحدات"
                  >
                    <i className="fas fa-trash-alt"></i>
                    مسح الكل
                  </Button>
                </div>
              </div>
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditUnit(unit)}
                            title="تعديل الوحدة"
                          >
                            <i className="fas fa-edit"></i>
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

        {/* نافذة حوار تعديل قائمة التصنيفات */}
        <EditCategoriesListDialog
          open={editCategoriesListOpen}
          onOpenChange={setEditCategoriesListOpen}
          categories={categories}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          addCategory={addCategory}
        />

        {/* نافذة حوار تعديل قائمة الوحدات */}
        <EditUnitsListDialog
          open={editUnitsListOpen}
          onOpenChange={setEditUnitsListOpen}
          units={units}
          updateUnit={updateUnit}
          deleteUnit={deleteUnit}
          addUnit={addUnit}
        />
      </div>
    </div>
  )
}
