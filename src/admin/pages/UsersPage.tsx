import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UsersList } from "../components/UsersList"
import { UserForm } from "../components/UserForm"
import { useAuth } from "@/contexts/AuthContext"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

export function UsersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { user } = useAuth()

    // التحقق من صلاحية إدارة المستخدمين
    const canManageUsers = user?.permissions.includes('manage_users') || user?.role === 'admin'

    // وظيفة تصدير البيانات
    const handleExport = () => {
        try {
            console.log('بدء عملية التصدير...')
            
            // طباعة جميع مفاتيح localStorage
            console.log('جميع مفاتيح localStorage:', Object.keys(localStorage))
            
            // تحضير البيانات للتصدير
            const data = {
                shifts: [],
                expenses: [],
                debts: [],
                inventory: []
            }

            // محاولة قراءة وتحليل كل نوع من البيانات بشكل منفصل
            try {
                // البحث عن المفتاح الصحيح للورديات
                const shiftsKey = Object.keys(localStorage).find(key => key.toLowerCase().includes('shift'))
                const shiftsRaw = shiftsKey ? localStorage.getItem(shiftsKey) : null
                console.log('Shifts key found:', shiftsKey)
                console.log('Raw shifts data:', shiftsRaw)
                if (shiftsRaw && shiftsRaw !== 'undefined' && shiftsRaw !== 'null') {
                    data.shifts = JSON.parse(shiftsRaw)
                    console.log('تم قراءة بيانات الورديات:', data.shifts)
                }
            } catch (e) {
                console.warn('خطأ في قراءة بيانات الورديات:', e)
            }

            try {
                // البحث عن المفتاح الصحيح للمصروفات
                const expensesKey = Object.keys(localStorage).find(key => key.toLowerCase().includes('expense'))
                const expensesRaw = expensesKey ? localStorage.getItem(expensesKey) : null
                console.log('Expenses key found:', expensesKey)
                console.log('Raw expenses data:', expensesRaw)
                if (expensesRaw && expensesRaw !== 'undefined' && expensesRaw !== 'null') {
                    data.expenses = JSON.parse(expensesRaw)
                    console.log('تم قراءة بيانات المصروفات:', data.expenses)
                }
            } catch (e) {
                console.warn('خطأ في قراءة بيانات المصروفات:', e)
            }

            try {
                // البحث عن المفتاح الصحيح للديون
                const debtsKey = Object.keys(localStorage).find(key => key.toLowerCase().includes('debt'))
                const debtsRaw = debtsKey ? localStorage.getItem(debtsKey) : null
                console.log('Debts key found:', debtsKey)
                console.log('Raw debts data:', debtsRaw)
                if (debtsRaw && debtsRaw !== 'undefined' && debtsRaw !== 'null') {
                    data.debts = JSON.parse(debtsRaw)
                    console.log('تم قراءة بيانات الديون:', data.debts)
                }
            } catch (e) {
                console.warn('خطأ في قراءة بيانات الديون:', e)
            }

            try {
                // البحث عن المفتاح الصحيح للمخزون
                const inventoryKey = Object.keys(localStorage).find(key => key.toLowerCase().includes('inventory') || key.toLowerCase().includes('product'))
                const inventoryRaw = inventoryKey ? localStorage.getItem(inventoryKey) : null
                console.log('Inventory key found:', inventoryKey)
                console.log('Raw inventory data:', inventoryRaw)
                if (inventoryRaw && inventoryRaw !== 'undefined' && inventoryRaw !== 'null') {
                    data.inventory = JSON.parse(inventoryRaw)
                    console.log('تم قراءة بيانات المخزون:', data.inventory)
                }
            } catch (e) {
                console.warn('خطأ في قراءة بيانات المخزون:', e)
            }

            console.log('البيانات المجمعة قبل التصدير:', data)

            // إنشاء ملف للتحميل
            const jsonString = JSON.stringify(data, null, 2)
            console.log('JSON string to be exported:', jsonString)
            
            const blob = new Blob([jsonString], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `hesabaty-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success("تم تصدير البيانات بنجاح")
        } catch (error) {
            console.error('تفاصيل الخطأ:', error)
            if (error instanceof Error) {
                toast.error(`حدث خطأ أثناء تصدير البيانات: ${error.message}`)
            } else {
                toast.error("حدث خطأ غير معروف أثناء تصدير البيانات")
            }
        }
    }

    // وظيفة استيراد البيانات
    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            try {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return

                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        const fileContent = e.target?.result as string
                        console.log('Imported file content:', fileContent)
                        
                        const data = JSON.parse(fileContent)
                        console.log('Parsed import data:', data)

                        // تسجيل البيانات قبل الحفظ
                        console.log('Data to be saved:', {
                            shifts: data.shifts,
                            expenses: data.expenses,
                            debts: data.debts,
                            inventory: data.inventory
                        })

                        // التحقق من صحة البيانات قبل الحفظ
                        if (Array.isArray(data.shifts)) {
                            localStorage.setItem('shifts', JSON.stringify(data.shifts))
                        }
                        if (Array.isArray(data.expenses)) {
                            localStorage.setItem('expenses', JSON.stringify(data.expenses))
                        }
                        if (Array.isArray(data.debts)) {
                            localStorage.setItem('debts', JSON.stringify(data.debts))
                        }
                        if (Array.isArray(data.inventory)) {
                            localStorage.setItem('inventory', JSON.stringify(data.inventory))
                        }

                        // تسجيل البيانات المخزنة
                        console.log('Current stored debts:', localStorage.getItem('debts'))
                        console.log('Current stored inventory:', localStorage.getItem('inventory'))

                        // إضافة رسائل تسجيل للتحقق من البيانات
                        console.log('Current debts after import:', localStorage.getItem('debts'))
                        console.log('Current inventory after import:', localStorage.getItem('inventory'))

                        toast.success("تم استيراد البيانات بنجاح")

                        // تحديث الصفحة لعرض البيانات الجديدة
                        window.location.reload()
                    } catch (error) {
                        console.error('Import parsing error:', error)
                        toast.error("الملف غير صالح")
                    }
                }
                reader.readAsText(file)
            } catch (error) {
                console.error('Import error:', error)
                toast.error("حدث خطأ أثناء استيراد البيانات")
            }
        }
        input.click()
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                {canManageUsers && (
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200">
                            <Download className="h-4 w-4 ml-1" />
                            تصدير البيانات
                        </Button>
                        <Button onClick={handleImport} variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200">
                            <Upload className="h-4 w-4 ml-1" />
                            استيراد البيانات
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>إضافة مستخدم جديد</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                                </DialogHeader>
                                <UserForm
                                    onSuccess={() => setIsDialogOpen(false)}
                                    submitLabel="إضافة"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
            <UsersList />
        </div>
    )
}
