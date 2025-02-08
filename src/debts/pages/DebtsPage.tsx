import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"
import { DebtsList } from "../components/DebtsList"
import { DebtsProvider } from "../contexts/DebtsContext"

export default function DebtsPage() {
  const { user } = useAuth()

  // التحقق من صلاحيات الوصول
  const canViewDebts = user?.permissions.includes("view_debts") || user?.role === "admin"
  
  if (!canViewDebts) {
    return <Navigate to="/" replace />
  }

  return (
    <DebtsProvider>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">إدارة الديون</h1>
          <p className="text-muted-foreground">
            قم بإدارة ومتابعة الديون والمدفوعات
          </p>
        </div>
        <DebtsList />
      </div>
    </DebtsProvider>
  )
}
