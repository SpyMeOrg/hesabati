import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
import { useDebts } from "../contexts/DebtsContext"
import { Debt } from "../types"

const formSchema = z.object({
  debtorName: z.string().optional(),
  phoneNumber: z.string().optional(),
  dueDate: z.string().optional(),
  amount: z.number().min(0, "المبلغ يجب أن يكون أكبر من صفر").optional(),
})

type EditDebtDialogProps = {
  debt: Debt
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDebtDialog({ debt, open, onOpenChange }: EditDebtDialogProps) {
  const { debts, updateDebt } = useDebts()
  const [isLoading, setIsLoading] = useState(false)

  // الحصول على آخر بيانات محدثة من السياق
  const currentDebt = debts.find((d) => d.id === debt.id)!

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      debtorName: currentDebt.debtorName,
      phoneNumber: currentDebt.phoneNumber || "",
      dueDate: currentDebt.dueDate || "",
      amount: currentDebt.amount || 0,
    },
  })

  // تحديث النموذج عند تغيير الدين
  useEffect(() => {
    if (currentDebt) {
      form.reset({
        debtorName: currentDebt.debtorName,
        phoneNumber: currentDebt.phoneNumber || "",
        dueDate: currentDebt.dueDate || "",
        amount: currentDebt.amount || 0,
      })
    }
  }, [currentDebt, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      // فقط إرسال القيم التي تم تغييرها
      const updateData = {
        ...(values.debtorName !== currentDebt.debtorName && { debtorName: values.debtorName }),
        ...(values.phoneNumber !== currentDebt.phoneNumber && { phoneNumber: values.phoneNumber }),
        ...(values.dueDate !== currentDebt.dueDate && { dueDate: values.dueDate }),
        ...(values.amount !== currentDebt.amount && { amount: values.amount }),
      }
      await updateDebt(debt.id, updateData)
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل الدين</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="debtorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الدائن</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم الدائن" {...field} />
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
                  <FormLabel>رقم الموبايل (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل رقم الموبايل" {...field} />
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
                  <FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                      placeholder="أدخل المبلغ" 
                      {...field} 
                      onChange={e => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
