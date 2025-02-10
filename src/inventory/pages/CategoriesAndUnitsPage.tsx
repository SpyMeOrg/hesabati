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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            title="تعديل التصنيف"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            title="حذف التصنيف"
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
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleEditCategory(subCategory)}
                                  title="تعديل التصنيف الفرعي"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteCategory(subCategory.id)}
                                  title="حذف التصنيف الفرعي"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUnit(unit.id)}
                            title="حذف الوحدة"
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

        {/* نافذة حوار قائمة التصنيفات */}
        <Dialog open={editCategoriesListOpen} onOpenChange={setEditCategoriesListOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل قائمة التصنيفات</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* زر إضافة تصنيف رئيسي */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setEditingCategory({ isSubcategory: false } as Category);
                    setAddCategoryOpen(true);
                  }}
                >
                  <i className="fas fa-plus ml-1"></i>
                  إضافة تصنيف رئيسي
                </Button>
              </div>

              {/* التصنيفات الرئيسية */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">التصنيفات الرئيسية</h3>
                {mainCategories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">لا توجد تصنيفات رئيسية</p>
                ) : (
                  mainCategories.map(category => (
                    <div key={category.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="font-medium min-w-24">اسم التصنيف:</label>
                            <input
                              type="text"
                              className="flex-1 border rounded px-2 py-1"
                              value={category.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                if (newName.trim()) {
                                  updateCategory(category.id, { ...category, name: newName })
                                    .catch(error => {
                                      console.error('خطأ في تحديث التصنيف:', error);
                                      alert('حدث خطأ أثناء تحديث التصنيف');
                                    });
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="font-medium min-w-24">الوصف:</label>
                            <input
                              type="text"
                              className="flex-1 border rounded px-2 py-1"
                              value={category.description || ''}
                              onChange={(e) => {
                                updateCategory(category.id, { ...category, description: e.target.value })
                                  .catch(error => {
                                    console.error('خطأ في تحديث التصنيف:', error);
                                    alert('حدث خطأ أثناء تحديث التصنيف');
                                  });
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              try {
                                // التحقق من المنتجات والتصنيفات الفرعية
                                const hasProducts = products.some(p => p.categoryId === category.id);
                                const hasSubCategories = categories.some(c => c.parentId === category.id);

                                if (hasProducts || hasSubCategories) {
                                  let errorMessage = 'لا يمكن حذف هذا التصنيف لأنه:';
                                  if (hasProducts) errorMessage += '\n- مرتبط بمنتجات';
                                  if (hasSubCategories) errorMessage += '\n- يحتوي على تصنيفات فرعية';
                                  alert(errorMessage);
                                  return;
                                }

                                if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
                                  await deleteCategory(category.id);
                                }
                              } catch (error) {
                                console.error('خطأ في حذف التصنيف:', error);
                                alert('حدث خطأ أثناء حذف التصنيف');
                              }
                            }}
                            title="حذف التصنيف"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </div>
                      </div>

                      {/* التصنيفات الفرعية */}
                      <div className="mt-4 space-y-3 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-gray-600">التصنيفات الفرعية</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setEditingCategory({ parentId: category.id, isSubcategory: true } as Category);
                              setAddCategoryOpen(true);
                            }}
                          >
                            <i className="fas fa-plus ml-1"></i>
                            إضافة تصنيف فرعي
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {getSubCategories(category.id).length === 0 ? (
                            <p className="text-center text-gray-500 py-2">لا توجد تصنيفات فرعية</p>
                          ) : (
                            getSubCategories(category.id).map(subCategory => (
                              <div key={subCategory.id} className="flex items-center gap-2 border rounded p-2 bg-white">
                                <input
                                  type="text"
                                  className="flex-1 border rounded px-2 py-1"
                                  value={subCategory.name}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    if (newName.trim()) {
                                      updateCategory(subCategory.id, { ...subCategory, name: newName })
                                        .catch(error => {
                                          console.error('خطأ في تحديث التصنيف الفرعي:', error);
                                          alert('حدث خطأ أثناء تحديث التصنيف الفرعي');
                                        });
                                    }
                                  }}
                                />
                                <input
                                  type="text"
                                  className="flex-1 border rounded px-2 py-1"
                                  placeholder="الوصف"
                                  value={subCategory.description || ''}
                                  onChange={(e) => {
                                    updateCategory(subCategory.id, { ...subCategory, description: e.target.value })
                                      .catch(error => {
                                        console.error('خطأ في تحديث التصنيف الفرعي:', error);
                                        alert('حدث خطأ أثناء تحديث التصنيف الفرعي');
                                      });
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    try {
                                      const hasProducts = products.some(p => p.categoryId === subCategory.id);
                                      if (hasProducts) {
                                        alert('لا يمكن حذف هذا التصنيف الفرعي لارتباطه بمنتجات');
                                        return;
                                      }

                                      if (window.confirm('هل أنت متأكد من حذف هذا التصنيف الفرعي؟')) {
                                        await deleteCategory(subCategory.id);
                                      }
                                    } catch (error) {
                                      console.error('خطأ في حذف التصنيف الفرعي:', error);
                                      alert('حدث خطأ أثناء حذف التصنيف الفرعي');
                                    }
                                  }}
                                  title="حذف التصنيف الفرعي"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* نافذة حوار قائمة الوحدات */}
        <Dialog open={editUnitsListOpen} onOpenChange={setEditUnitsListOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل قائمة الوحدات</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setEditingUnit(null);
                    setAddUnitOpen(true);
                  }}
                >
                  <i className="fas fa-plus ml-1"></i>
                  إضافة وحدة جديدة
                </Button>
              </div>
              {units.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد وحدات</p>
              ) : (
                units.map(unit => (
                  <div key={unit.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="font-medium min-w-24">اسم الوحدة:</label>
                          <input
                            type="text"
                            className="flex-1 border rounded px-2 py-1"
                            value={unit.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              if (newName.trim()) {
                                updateUnit(unit.id, { ...unit, name: newName })
                                  .catch(error => {
                                    console.error('خطأ في تحديث الوحدة:', error);
                                    alert('حدث خطأ أثناء تحديث الوحدة');
                                  });
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="font-medium min-w-24">الرمز:</label>
                          <input
                            type="text"
                            className="flex-1 border rounded px-2 py-1"
                            value={unit.symbol || ''}
                            onChange={(e) => {
                              updateUnit(unit.id, { ...unit, symbol: e.target.value })
                                .catch(error => {
                                  console.error('خطأ في تحديث الوحدة:', error);
                                  alert('حدث خطأ أثناء تحديث الوحدة');
                                });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            const hasProducts = products.some(p => p.unitId === unit.id);
                            if (hasProducts) {
                              alert('لا يمكن حذف هذه الوحدة لارتباطها بمنتجات');
                              return;
                            }

                            if (window.confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
                              await deleteUnit(unit.id);
                            }
                          } catch (error) {
                            console.error('خطأ في حذف الوحدة:', error);
                            alert('حدث خطأ أثناء حذف الوحدة');
                          }
                        }}
                        title="حذف الوحدة"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
