import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Unit } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EditUnitsListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: Unit[]
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export function EditUnitsListDialog({
  open,
  onOpenChange,
  units,
  updateUnit,
  deleteUnit,
  addUnit
}: EditUnitsListDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [newUnit, setNewUnit] = useState({ name: "", symbol: "" })

  const handleAddUnit = async () => {
    if (!newUnit.name.trim()) return

    try {
      await addUnit({
        name: newUnit.name.trim(),
        symbol: newUnit.symbol.trim() || undefined
      })
      setNewUnit({ name: "", symbol: "" })
    } catch (error) {
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الوحدة")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل قائمة الوحدات</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h4 className="font-medium">إضافة وحدة جديدة</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الوحدة</Label>
                    <Input
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      placeholder="مثال: كيلو"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرمز (اختياري)</Label>
                    <Input
                      value={newUnit.symbol}
                      onChange={(e) => setNewUnit({ ...newUnit, symbol: e.target.value })}
                      placeholder="مثال: كج"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleAddUnit}
                    disabled={!newUnit.name.trim()}
                  >
                    <i className="fas fa-plus ml-2"></i>
                    إضافة وحدة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الوحدة</TableHead>
                  <TableHead>الرمز</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map(unit => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Input
                        value={unit.name}
                        onChange={async (e) => {
                          try {
                            await updateUnit(unit.id, { name: e.target.value })
                          } catch (error) {
                            setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الوحدة")
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={unit.symbol || ""}
                        onChange={async (e) => {
                          try {
                            await updateUnit(unit.id, { symbol: e.target.value || undefined })
                          } catch (error) {
                            setError(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الوحدة")
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full flex items-center justify-center gap-2"
                        onClick={async () => {
                          if (window.confirm('هل أنت متأكد من حذف هذه الوحدة؟')) {
                            try {
                              await deleteUnit(unit.id)
                            } catch (error) {
                              setError(error instanceof Error ? error.message : "حدث خطأ أثناء حذف الوحدة")
                            }
                          }
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span>حذف</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 