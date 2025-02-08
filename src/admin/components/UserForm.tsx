import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Role, Permission, DEFAULT_PERMISSIONS, PERMISSION_LABELS, ROLE_LABELS, PERMISSION_GROUPS } from "../types"
import { useUsers } from "../contexts/UsersContext"
import { toast } from "sonner"

// مخطط التحقق من صحة النموذج
const formSchema = z.object({
  username: z.string(),
  email: z
    .string()
    .email("البريد الإلكتروني غير صالح"),
  password: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"] as const),
  permissions: z.array(z.string())
})

type FormData = z.infer<typeof formSchema>

interface UserFormProps {
  initialData?: {
    id: string
    username: string
    email: string
    role: Role
    permissions: Permission[]
  }
  onSuccess?: () => void
  submitLabel?: string
}

export function UserForm({
  initialData,
  onSuccess,
  submitLabel = "حفظ"
}: UserFormProps) {
  const { addUser, updateUser } = useUsers()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: initialData?.username || "",
      email: initialData?.email || "",
      role: initialData?.role || "viewer",
      permissions: initialData?.permissions || DEFAULT_PERMISSIONS.viewer,
    },
  })

  const selectedRole = form.watch("role") as Role
  const selectedPermissions = form.watch("permissions") as Permission[]

  const handleSubmit = async (data: FormData) => {
    try {
      if (initialData) {
        await updateUser(initialData.id, {
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role as Role,
          permissions: data.permissions as Permission[],
        })
      } else {
        if (!data.password) {
          toast.error("كلمة المرور مطلوبة عند إنشاء مستخدم جديد")
          return
        }
        await addUser({
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role as Role,
          permissions: data.permissions as Permission[],
        })
      }
      onSuccess?.()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("حدث خطأ أثناء حفظ المستخدم")
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">اسم المستخدم</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="transition-colors focus:ring-2 focus:ring-primary/20" 
                    placeholder="ادخل اسم المستخدم"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="email" 
                    className="transition-colors focus:ring-2 focus:ring-primary/20"
                    placeholder="example@domain.com"
                    dir="ltr"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  {initialData ? "كلمة المرور (اتركها فارغة إذا لم ترد تغييرها)" : "كلمة المرور"}
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    className="transition-colors focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">الدور</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue("permissions", DEFAULT_PERMISSIONS[value as Role])
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="transition-colors focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent position="popper" className="min-w-[180px]">
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-right">
                        <div className="flex w-full">
                          <span className="flex-1">{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <FormLabel className="block text-sm font-medium text-gray-700 px-4 py-2.5 border-b bg-gray-50">
                <div className="flex items-center">
                  <span className="flex-1">الصلاحيات</span>
                  <div className="flex gap-[140px] ml-[70px]">
                    <div className="flex-1 flex justify-center">
                      <Checkbox
                        checked={Object.values(PERMISSION_GROUPS).every(group => 
                          group.permissions.find(p => p.startsWith('view_'))! &&
                          field.value?.includes(group.permissions.find(p => p.startsWith('view_'))!)
                        )}
                        onCheckedChange={(checked) => {
                          const viewPermissions = Object.values(PERMISSION_GROUPS)
                            .map(group => group.permissions.find(p => p.startsWith('view_'))!)
                          const newPermissions = checked
                            ? [...new Set([...field.value || [], ...viewPermissions])]
                            : field.value?.filter(p => !p.startsWith('view_')) || []
                          field.onChange(newPermissions)
                        }}
                        className="h-[18px] w-[18px] rounded-[4px] border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <Checkbox
                        checked={Object.values(PERMISSION_GROUPS).every(group => 
                          group.permissions.find(p => p.startsWith('manage_'))! &&
                          field.value?.includes(group.permissions.find(p => p.startsWith('manage_'))!)
                        )}
                        onCheckedChange={(checked) => {
                          const managePermissions = Object.values(PERMISSION_GROUPS)
                            .map(group => group.permissions.find(p => p.startsWith('manage_'))!)
                          const newPermissions = checked
                            ? [...new Set([...field.value || [], ...managePermissions])]
                            : field.value?.filter(p => !p.startsWith('manage_')) || []
                          field.onChange(newPermissions)
                        }}
                        disabled={selectedRole === "viewer"}
                        className="h-[18px] w-[18px] rounded-[4px] border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </FormLabel>
              <div className="divide-y">
                {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                  const viewPermission = group.permissions.find(p => p.startsWith('view_'))!;
                  const managePermission = group.permissions.find(p => p.startsWith('manage_'))!;
                  
                  return (
                    <div key={key} className="flex items-center px-4 py-2 hover:bg-gray-50/80">
                      <div className="w-32 text-sm font-medium text-gray-900">{group.title}</div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <FormField
                          key={viewPermission}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-center">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(viewPermission)}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = checked
                                      ? [...field.value, viewPermission]
                                      : field.value?.filter((p) => p !== viewPermission)
                                    field.onChange(updatedPermissions)
                                  }}
                                  className="ml-2 h-[18px] w-[18px] rounded-[4px] border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600 cursor-pointer mb-0 select-none">
                                عرض
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          key={managePermission}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-center">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(managePermission)}
                                  onCheckedChange={(checked) => {
                                    const updatedPermissions = checked
                                      ? [...field.value, managePermission]
                                      : field.value?.filter((p) => p !== managePermission)
                                    field.onChange(updatedPermissions)
                                  }}
                                  disabled={selectedRole === "viewer"}
                                  className="ml-2 h-[18px] w-[18px] rounded-[4px] border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600 cursor-pointer mb-0 select-none">
                                إدارة
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary/90 hover:bg-primary transition-colors">
          {submitLabel}
        </Button>
      </form>
    </Form>
  )
}
