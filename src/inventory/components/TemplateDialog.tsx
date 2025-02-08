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
import { Textarea } from "@/components/ui/textarea"
import { ProductTemplate, defaultTemplates, TemplateCategory, TemplateUnit } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { v4 as uuidv4 } from 'uuid'

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate?: ProductTemplate
}

export function TemplateDialog({
  open,
  onOpenChange,
  editingTemplate
}: TemplateDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("new")
  const [name, setName] = useState(editingTemplate?.name || "")
  const [description, setDescription] = useState(editingTemplate?.description || "")
  const [categories, setCategories] = useState<TemplateCategory[]>(editingTemplate?.categories || [])
  const [units, setUnits] = useState<TemplateUnit[]>(editingTemplate?.units || [])

  // للتصنيفات الجديدة
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  // للوحدات الجديدة
  const [newUnitName, setNewUnitName] = useState("")
  const [newUnitSymbol, setNewUnitSymbol] = useState("")

  useEffect(() => {
    if (open && editingTemplate) {
      setName(editingTemplate.name)
      setDescription(editingTemplate.description || "")
      setCategories(editingTemplate.categories || [])
      setUnits(editingTemplate.units || [])
    }
  }, [open, editingTemplate])

  const handleTemplateSelect = (templateId: string) => {
    const template = defaultTemplates[templateId]
    if (template) {
      setName(template.name)
      setDescription(template.description || "")
      setCategories(template.categories || [])
      setUnits(template.units || [])
      setActiveTab("new")
    }
  }

  const addCategory = () => {
    if (newCategoryName.trim()) {
      setCategories(prev => [...prev, {
        id: uuidv4(),
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      }])
      setNewCategoryName("")
      setNewCategoryDescription("")
    }
  }

  const addUnit = () => {
    if (newUnitName.trim()) {
      setUnits(prev => [...prev, {
        id: uuidv4(),
        name: newUnitName.trim(),
        symbol: newUnitSymbol.trim() || undefined
      }])
      setNewUnitName("")
      setNewUnitSymbol("")
    }
  }

  const removeCategory = (index: number) => {
    setCategories(prev => prev.filter((_, i) => i !== index))
  }

  const removeUnit = (index: number) => {
    setUnits(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const template: ProductTemplate = {
      id: editingTemplate?.id || uuidv4(),
      name,
      description,
      categories,
      units,
      products: editingTemplate?.products || []
    }
    // TODO: حفظ القالب
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة قالب منتجات</DialogTitle>
          <DialogDescription>
            اختر قالب جاهز أو قم بإنشاء قالب جديد
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">قالب جديد</TabsTrigger>
            <TabsTrigger value="template">قوالب جاهزة</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اسم القالب</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="أدخل اسم القالب"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>وصف القالب</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="أدخل وصف القالب"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>التصنيفات</Label>
                        <span className="text-sm text-gray-500">({categories.length})</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="اسم التصنيف"
                        />
                        <Button onClick={addCategory} type="button">إضافة</Button>
                      </div>
                      <Input
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="وصف التصنيف (اختياري)"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>الوحدات</Label>
                        <span className="text-sm text-gray-500">({units.length})</span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          placeholder="اسم الوحدة"
                        />
                        <Input
                          value={newUnitSymbol}
                          onChange={(e) => setNewUnitSymbol(e.target.value)}
                          placeholder="الرمز (اختياري)"
                          className="w-24"
                        />
                        <Button onClick={addUnit} type="button">إضافة</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التصنيف</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category, index) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeCategory(index)}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الوحدة</TableHead>
                        <TableHead>الرمز</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((unit, index) => (
                        <TableRow key={unit.id}>
                          <TableCell>{unit.name}</TableCell>
                          <TableCell>{unit.symbol}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeUnit(index)}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit}>
                حفظ
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="template">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(defaultTemplates).map(([id, template]) => (
                <Card key={id} className="cursor-pointer hover:border-primary" onClick={() => handleTemplateSelect(id)}>
                  <CardContent className="pt-6">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                    <div className="mb-2">
                      <span className="font-medium">التصنيفات: </span>
                      <span>{template.categories.length}</span>
                    </div>
                    <div>
                      <span className="font-medium">الوحدات: </span>
                      <span>{template.units?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
