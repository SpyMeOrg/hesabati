import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { MainLayout } from "./components/layout/MainLayout"
import { LoginPage } from "./pages/auth/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ShiftsPage } from "./pages/shifts/ShiftsPage"
import { ShiftsHistoryPage } from "./pages/shifts/ShiftsHistoryPage"
import { EditShiftPage } from "./pages/shifts/EditShiftPage"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ShiftsProvider } from "./contexts/ShiftsContext"
import { UsersProvider } from "./admin/contexts/UsersContext"
import { DebtsProvider } from "./debts/contexts/DebtsContext"
import { ExpensesProvider } from "./expenses/contexts/ExpensesContext"
import { InventoryProvider } from "./inventory/contexts/InventoryContext"
import { useState, useEffect } from "react"
import { UsersPage } from "./admin/pages/UsersPage"
import DebtsPage from "./debts/pages/DebtsPage"
import ExpensesPage from "./expenses/pages/ExpensesPage"
import { InventoryRoutes } from "./inventory/routes"
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  // إضافة تأخير بسيط للتأكد من تحميل حالة تسجيل الدخول
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (isLoading) {
    return null // أو يمكنك عرض مؤشر تحميل هنا
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <MainLayout>{children}</MainLayout>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UsersProvider>
            <BrowserRouter>
              <ShiftsProvider>
                <ExpensesProvider>
                  <DebtsProvider>
                    <InventoryProvider>
                      <div dir="rtl">
                        <Toaster richColors position="top-center" />
                        <Routes>
                          <Route path="/login" element={<LoginPage />} />
                          
                          <Route
                            path="/"
                            element={
                              <ProtectedRoute>
                                <DashboardPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/expenses"
                            element={
                              <ProtectedRoute>
                                <ExpensesPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/debts"
                            element={
                              <ProtectedRoute>
                                <DebtsPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* مسارات المخزون */}
                          <Route
                            path="/inventory/*"
                            element={
                              <ProtectedRoute>
                                <InventoryRoutes />
                              </ProtectedRoute>
                            }
                          />

                          {/* مسارات الورديات */}
                          <Route
                            path="/shifts/new"
                            element={
                              <ProtectedRoute>
                                <ShiftsPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/shifts/history"
                            element={
                              <ProtectedRoute>
                                <ShiftsHistoryPage />
                              </ProtectedRoute>
                            }
                          />

                          <Route
                            path="/shifts/:id/edit"
                            element={
                              <ProtectedRoute>
                                <EditShiftPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* مسارات الإدارة */}
                          <Route
                            path="/dashboard/users"
                            element={
                              <ProtectedRoute>
                                <UsersPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* التوجيه الافتراضي */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </div>
                    </InventoryProvider>
                  </DebtsProvider>
                </ExpensesProvider>
              </ShiftsProvider>
            </BrowserRouter>
          </UsersProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App