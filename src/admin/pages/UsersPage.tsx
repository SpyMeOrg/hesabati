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

export function UsersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { user } = useAuth()

    // التحقق من صلاحية إدارة المستخدمين
    const canManageUsers = user?.permissions.includes('manage_users') || user?.role === 'admin'

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                {canManageUsers && (
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
                )}
            </div>
            <UsersList />
        </div>
    )
}
