import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { User } from "../types"
import { useUsers } from "../contexts/UsersContext"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserForm } from "./UserForm"
import { cn } from "@/lib/utils"
import { Permission, Role, PERMISSION_LABELS, PERMISSION_GROUPS } from "../types"

export function UsersList() {
    const { users, deleteUser } = useUsers()
    const { user: currentUser } = useAuth()
    const { toast } = useToast()
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // التحقق من صلاحيات المستخدم
    const canViewUsers = currentUser?.permissions.includes('view_users') || currentUser?.role === 'admin'
    const canManageUsers = currentUser?.permissions.includes('manage_users') || currentUser?.role === 'admin'

    // إذا لم يكن لديه صلاحية العرض، نرجع null
    if (!canViewUsers) {
        return null
    }

    const getPermissionLabel = (permission: Permission): string => {
        return PERMISSION_LABELS[permission] || permission
    }

    const handleDelete = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        
        // التحقق من أن المستخدم ليس المسؤول الرئيسي (أول admin)
        const isMainAdmin = users.findIndex((u) => u.role === "admin") === users.findIndex((u) => u.id === id);
        if (isMainAdmin) {
            toast({
                title: "لا يمكن حذف المسؤول الرئيسي",
                variant: "destructive",
            });
            return;
        }

        // التحقق من أن المستخدم لا يحاول حذف نفسه
        if (id === currentUser?.id) {
            toast({
                title: "لا يمكنك حذف حسابك الخاص",
                variant: "destructive",
            });
            return;
        }

        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            try {
                await deleteUser(id);
                toast({
                    title: "تم حذف المستخدم بنجاح",
                });
            } catch (error: any) {
                toast({
                    title: error.message || "حدث خطأ أثناء حذف المستخدم",
                    variant: "destructive",
                });
            }
        }
    }

    return (
        <div className="rounded-lg border bg-white shadow">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="text-center font-bold w-40 py-4 text-gray-600">اسم المستخدم</TableHead>
                        <TableHead className="text-center font-bold w-48 py-4 text-gray-600">البريد الإلكتروني</TableHead>
                        <TableHead className="text-center font-bold w-24 py-4 text-gray-600">الدور</TableHead>
                        <TableHead className="text-center font-bold w-32 py-4 text-gray-600">الصلاحيات</TableHead>
                        {canManageUsers && <TableHead className="text-center font-bold w-24 py-4 text-gray-600">الإجراءات</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow 
                            key={user.id}
                            className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50"
                        >
                            <TableCell className="text-center truncate max-w-[160px] py-3 text-gray-700">{user.username}</TableCell>
                            <TableCell className="text-center truncate max-w-[192px] py-3 text-gray-700">{user.email}</TableCell>
                            <TableCell className="text-center py-3">
                                <span className={cn(
                                    "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                                    {
                                        "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10": user.role === "admin",
                                        "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/10": user.role === "editor",
                                        "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/10": user.role === "viewer"
                                    }
                                )}>
                                    {user.role === 'admin' && 'مدير'}
                                    {user.role === 'editor' && 'محرر'}
                                    {user.role === 'viewer' && 'مشاهد'}
                                </span>
                            </TableCell>
                            <TableCell className="text-center py-3">
                                <div className="flex justify-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="h-8 bg-white hover:bg-gray-50/80"
                                                size="sm"
                                            >
                                                <span className="text-xs ml-1 font-bold text-gray-600">{user.permissions.length}</span>
                                                <span className="text-xs text-gray-500 font-medium">صلاحيات</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64">
                                            <div className="p-2">
                                                {Object.values(PERMISSION_GROUPS).map((group) => (
                                                    <div key={group.title} className="mb-3 last:mb-0">
                                                        <div className="flex items-center mb-2">
                                                            <div className="h-px flex-1 bg-gray-100" />
                                                            <span className="text-xs font-bold text-gray-500 px-3">{group.title}</span>
                                                            <div className="h-px flex-1 bg-gray-100" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            {group.permissions.map((permission) => (
                                                                <div
                                                                    key={permission}
                                                                    className={cn(
                                                                        "flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors",
                                                                        user.permissions.includes(permission)
                                                                            ? "bg-blue-50/80 text-blue-700 shadow-sm"
                                                                            : "bg-gray-50/80 text-gray-500"
                                                                    )}
                                                                >
                                                                    <span className="text-xs font-bold">
                                                                        {PERMISSION_LABELS[permission]}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "text-xs font-bold",
                                                                        user.permissions.includes(permission)
                                                                            ? "text-blue-500"
                                                                            : "text-gray-400"
                                                                    )}>
                                                                        {user.permissions.includes(permission) ? "✓" : "✕"}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                            {canManageUsers && (
                                <TableCell className="text-center py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setIsEditDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 ml-1" />
                                            <span className="text-xs font-medium">تعديل</span>
                                        </Button>
                                        {user.id !== currentUser?.id && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 className="h-4 w-4 ml-1" />
                                                <span className="text-xs font-medium">حذف</span>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل المستخدم</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <UserForm
                            initialData={selectedUser}
                            onSuccess={() => {
                                setIsEditDialogOpen(false)
                                setSelectedUser(null)
                            }}
                            submitLabel="حفظ التغييرات"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
