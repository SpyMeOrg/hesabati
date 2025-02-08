import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Home } from "lucide-react"

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">عذراً، الصفحة غير موجودة</p>
        <Button onClick={() => navigate("/")} size="lg">
          <Home className="mr-2 h-5 w-5" />
          العودة للصفحة الرئيسية
        </Button>
      </div>
    </div>
  )
}
