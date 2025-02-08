import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDebts } from "../contexts/DebtsContext"
import { useAuth } from "@/contexts/AuthContext"
import { AddDebtData, DebtType, BusinessPurpose } from "../types"
import { ImageUploader } from "@/components/ui/image-uploader"

const formSchema = z.object({
  debtorName: z.string().min(1, "اسم الدائن مطلوب"),
  phoneNumber: z.string().optional(),
  amount: z.number().min(1, "المبلغ مطلوب"),
  dueDate: z.string().optional(),
  debtDate: z.string().min(1, "تاريخ الدين مطلوب"),
  description: z.string().optional(),
  debtType: z.enum(["regular", "business_loan"] as const),
  businessPurpose: z.enum(["equipment", "renovations", "inventory", "cash_flow"] as const).optional(),
  invoiceImage: z.string().nullable().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddDebtDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddDebtDialog({ open, onOpenChange }: AddDebtDialogProps) {
  const { addDebt } = useDebts()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      debtorName: "",
      phoneNumber: "",
      amount: 0,
      dueDate: "",
      debtDate: new Date().toISOString().split("T")[0],
      description: "",
      debtType: "regular" as DebtType,
      businessPurpose: undefined,
      invoiceImage: null,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      const newDebt: AddDebtData = {
        debtorName: data.debtorName,
        phoneNumber: data.phoneNumber,
        amount: data.amount,
        dueDate: data.dueDate,
        debtDate: data.debtDate,
        description: data.description || "",
        createdBy: user?.id || "",
        debtType: data.debtType,
        businessPurpose: data.debtType === "business_loan" ? data.businessPurpose : undefined,
        invoiceImage: data.invoiceImage,
      }
      await addDebt(newDebt)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة دين جديد</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="debtType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الدين</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الدين" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">دين عادي</SelectItem>
                        <SelectItem value="business_loan">سلفة للمطعم</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("debtType") === "business_loan" && (
                <FormField
                  control={form.control}
                  name="businessPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الغرض من السلفة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الغرض" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash_flow">سيولة نقدية</SelectItem>
                          <SelectItem value="inventory">بضاعة</SelectItem>
                          <SelectItem value="equipment">شراء معدات</SelectItem>
                          <SelectItem value="renovations">تجديدات</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="debtorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{form.watch("debtType") === "business_loan" ? "اسم الدائن" : "اسم الدائن"}</FormLabel>
                    <FormControl>
                      <Input placeholder={form.watch("debtType") === "business_loan" ? "ادخل اسم الدائن" : "ادخل اسم الدائن"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الموبايل</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="ادخل رقم الموبايل" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="أدخل المبلغ"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="debtDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الدين</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="اختر تاريخ الدين"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاستحقاق</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="اختر تاريخ الاستحقاق"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل وصف أو ملاحظات إضافية (اختياري)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة الفاتورة</FormLabel>
                    <FormControl>
                      <ImageUploader
                        value={field.value || ""}
                        onChange={field.onChange}
                        onRemove={() => field.onChange(null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
