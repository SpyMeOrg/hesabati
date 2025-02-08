import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Unit } from "../types"

interface UnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUnit?: Unit | null
  onSave: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export function UnitDialog({
  open,
  onOpenChange,
  editingUnit,
  onSave
}: UnitDialogProps) {
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")

  useEffect(() => {
    if (open && editingUnit) {
      setName(editingUnit.name)
      setSymbol(editingUnit.symbol || "")
    } else if (!open) {
      setName("")
      setSymbol("")
    }
  }, [open, editingUnit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSave({
        name: name.trim(),
        symbol: symbol.trim() || undefined
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving unit:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الوحدة")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editingUnit ? "تعديل وحدة" : "إضافة وحدة جديدة"}</DialogTitle>
          <DialogDescription>
            قم بإدخال بيانات الوحدة
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الوحدة</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كيلو، قطعة"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">الرمز (اختياري)</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="مثال: كج، ق"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {editingUnit ? "تعديل" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
