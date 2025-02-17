import { createContext, useContext, useState, useEffect } from "react"
import { User } from "../admin/types"

interface AuthContextType {
  user: User | null
  users: User[]
  isLoading: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user")
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("users")
    return savedUsers ? JSON.parse(savedUsers) : []
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true)
    try {
      const user = users.find(u => 
        (u.username === usernameOrEmail || u.email === usernameOrEmail)
      )

      if (!user) {
        throw new Error("اسم المستخدم أو البريد الإلكتروني غير صحيح")
      }

      // في الواقع، يجب أن نتحقق من كلمة المرور بشكل آمن على الخادم
      // هنا نقوم فقط بمحاكاة عملية تسجيل الدخول
      // في حالة المستخدم الافتراضي admin نقبل كلمة المرور admin123
      if (user.id === "admin" && password !== "admin123") {
        throw new Error("كلمة المرور غير صحيحة")
      } else if (user.id !== "admin") {
        // للمستخدمين الآخرين، نتحقق من كلمة المرور المخزنة
        const storedPassword = localStorage.getItem(`password_${user.id}`)
        if (password !== storedPassword) {
          throw new Error("كلمة المرور غير صحيحة")
        }
      }

      setUser(user)
      localStorage.setItem("user", JSON.stringify(user))
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const isAuthenticated = user !== null

  return (
    <AuthContext.Provider value={{ user, users, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}