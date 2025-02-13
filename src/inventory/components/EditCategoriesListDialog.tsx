import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Category } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditCategoriesListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export function EditCategoriesListDialog({
  open,
  onOpenChange,
  categories,
  updateCategory,
  deleteCategory,
  addCategory
}: EditCategoriesListDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const mainCategories = categories.filter(c => !c.isSubcategory)

  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.isSubcategory && c.parentId === parentId)
  }

  const handleAddSubCategory = async (parentId: string) => {
    try {
      await addCategory({
        name: "تصنيف فرعي جديد",
        isSubcategory: true,
        parentId
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء إضافة التصنيف الفرعي")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل قائمة التصنيفات</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await addCategory({
                    name: "تصنيف جديد",
                    isSubcategory: false
                  })
                } catch (error) {
                  setError(error instanceof Error ? error.message : "حدث خطأ أثناء إضافة التصنيف")
                }
              }}
            >
              <i className="fas fa-plus ml-2"></i>
              إضافة تصنيف رئيسي
            </Button>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              <Accordion type="multiple" className="w-full">
                {mainCategories.map(category => (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1">
                          <Input
                            value={category.name}
                            onChange={async (e) => {
                              try {
                                await updateCategory(category.id, { name: e.target.value })
                              } catch (error) {
                                setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث التصنيف")
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-[300px]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full flex items-center justify-center gap-2"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
                                try {
                                  await deleteCategory(category.id)
                                } catch (error) {
                                  setError(error instanceof Error ? error.message : "حدث خطأ أثناء حذف التصنيف")
                                }
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                            <span>حذف</span>
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>الوصف</Label>
                              <Input
                                value={category.description || ""}
                                onChange={async (e) => {
                                  try {
                                    await updateCategory(category.id, { description: e.target.value })
                                  } catch (error) {
                                    setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث التصنيف")
                                  }
                                }}
                              />
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">التصنيفات الفرعية</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddSubCategory(category.id)}
                                >
                                  <i className="fas fa-plus ml-2"></i>
                                  إضافة تصنيف فرعي
                                </Button>
                              </div>

                              <div className="space-y-2">
                                {getSubCategories(category.id).map(subCategory => (
                                  <Card key={subCategory.id}>
                                    <CardContent className="py-3">
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                          <Input
                                            value={subCategory.name}
                                            onChange={async (e) => {
                                              try {
                                                await updateCategory(subCategory.id, { name: e.target.value })
                                              } catch (error) {
                                                setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث التصنيف الفرعي")
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full flex items-center justify-center gap-2"
                                            onClick={async () => {
                                              if (window.confirm('هل أنت متأكد من حذف هذا التصنيف الفرعي؟')) {
                                                try {
                                                  await deleteCategory(subCategory.id)
                                                } catch (error) {
                                                  setError(error instanceof Error ? error.message : "حدث خطأ أثناء حذف التصنيف الفرعي")
                                                }
                                              }
                                            }}
                                          >
                                            <i className="fas fa-trash-alt"></i>
                                            <span>حذف</span>
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 