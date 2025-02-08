import { useAuth } from "@/contexts/AuthContext"
import { LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const navigationLinks = [
    { to: "/", label: "الرئيسية", show: true },
    { to: "/shifts/history", label: "سجل الورديات", show: user?.permissions.includes("view_shifts") || user?.role === "admin" },
    { to: "/expenses", label: "مصروفات الخزينة", show: user?.permissions.includes("view_expenses") || user?.role === "admin" },
    { to: "/debts", label: "الديون", show: user?.permissions.includes("view_debts") || user?.role === "admin" },
    { to: "/inventory", label: "المخزون", show: user?.permissions.includes("view_inventory") || user?.role === "admin" },
    { to: "/dashboard/users", label: "لوحة التحكم", show: user?.permissions.includes("manage_users") || user?.role === "admin" }
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center gap-4">
              {/* زر القائمة المتنقلة */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative transition-all duration-200",
                    "bg-blue-600 hover:bg-blue-700 text-white",
                    "focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
                    "rounded-full shadow-lg",
                    isMobileMenuOpen && "bg-blue-700"
                  )}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 transition-transform duration-200 rotate-90" />
                  ) : (
                    <Menu className="w-5 h-5 transition-transform duration-200" />
                  )}
                </Button>
              </div>

              {/* عنوان الموقع */}
              <h1 className="text-xl font-bold">كشري المماليك</h1>

              {/* القائمة الرئيسية */}
              <nav className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
                {navigationLinks.map(link => link.show && (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-medium transition-colors px-2 py-1 ${
                      location.pathname === link.to ? "text-blue-400" : "text-white hover:text-gray-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* معلومات المستخدم وزر تسجيل الخروج */}
            <div className="flex items-center gap-4 mr-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm">{user?.username}</span>
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  {
                    "bg-red-400/10 text-red-400 ring-red-400/20": user?.role === "admin",
                    "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20": user?.role === "editor",
                    "bg-green-400/10 text-green-400 ring-green-400/20": user?.role === "viewer"
                  }
                )}>
                  {user?.role === 'admin' && 'مدير'}
                  {user?.role === 'editor' && 'محرر'}
                  {user?.role === 'viewer' && 'مشاهد'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:text-gray-300 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* القائمة المتنقلة */}
          <div className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}>
            <nav className="py-4 px-4 space-y-2">
              {navigationLinks.map(link => link.show && (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block text-sm font-medium transition-colors px-2 py-1 ${
                    location.pathname === link.to ? "text-blue-400" : "text-white hover:text-gray-300"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};