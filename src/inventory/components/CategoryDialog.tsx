import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Category, NewCategory } from "../types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory?: Category
  onSave: (category: NewCategory) => Promise<void>
  mainCategories?: Category[]
}

export function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  onSave,
  mainCategories = []
}: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubcategory, setIsSubcategory] = useState(false)
  const [parentId, setParentId] = useState("")
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setName(editingCategory.name)
        setDescription(editingCategory.description || "")
        setIsSubcategory(editingCategory.isSubcategory || false)
        setParentId(editingCategory.parentId || "")
      } else {
        resetForm()
      }
      setError(undefined)
    }
  }, [open, editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)

    try {
      // التحقق من اختيار التصنيف الرئيسي
      if (isSubcategory && !parentId) {
        setError("الرجاء اختيار التصنيف الرئيسي")
        return
      }

      // التحقق من تكرار الاسم في نفس المستوى
      const duplicateCategory = mainCategories.find(c => 
        c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (!editingCategory || c.id !== editingCategory.id) &&
        c.isSubcategory === isSubcategory &&
        (isSubcategory ? c.parentId === parentId : true)
      )
      if (duplicateCategory) {
        setError("يوجد تصنيف بنفس الاسم")
        return
      }

      setIsLoading(true)
      const category: NewCategory = {
        name: name.trim(),
        description: description.trim() || undefined,
        isSubcategory,
        parentId: isSubcategory ? parentId : undefined
      }
      await onSave(category)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error saving category:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ التصنيف")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setIsSubcategory(false)
    setParentId("")
    setError(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">اسم التصنيف</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم التصنيف"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف التصنيف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف التصنيف"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="isSubcategory">تصنيف فرعي</Label>
              <Switch
                id="isSubcategory"
                checked={isSubcategory}
                onCheckedChange={setIsSubcategory}
              />
            </div>

            {isSubcategory && (
              <div className="space-y-2">
                <Label htmlFor="parentId">التصنيف الرئيسي</Label>
                <Select
                  value={parentId}
                  onValueChange={setParentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف الرئيسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || (isSubcategory && !parentId)}
            >
              {isLoading ? "جاري الحفظ..." : editingCategory ? "حفظ التعديلات" : "إضافة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
