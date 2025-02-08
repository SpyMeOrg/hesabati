import { useAuth } from "@/contexts/AuthContext"
import { Permission } from "@/admin/types"
import { ReactNode } from "react"

interface CanModifyProps {
  children: ReactNode
  permission?: Permission
}

export function CanModify({ children, permission }: CanModifyProps) {
  const { user } = useAuth()

  // إذا لم يكن هناك مستخدم، لا تظهر شيئا
  if (!user) return null

  // إذا كان المستخدم مدير، اظهر كل شيء
  if (user.role === "admin") return <>{children}</>

  // إذا كان هناك صلاحية محددة، تحقق منها
  if (permission && !user.permissions.includes(permission)) return null

  // إذا كان المستخدم مشاهد، لا تظهر أدوات التعديل
  if (user.role === "viewer") return null

  return <>{children}</>
}
