import React, { createContext, useContext, useState, useEffect } from "react"

export interface Shift {
  id: string
  date: string
  type: "morning" | "evening"
  sales: number
  expenses: number
  cash: number
  createdAt: string
  notes: string
}

interface ShiftsContextType {
  shifts: Shift[]
  addShift: (shift: Omit<Shift, "id" | "createdAt">) => Shift
  deleteShift: (id: string) => void
  updateShift: (shift: Shift) => void
  clearAllShifts: () => void
}

const ShiftsContext = createContext<ShiftsContextType | null>(null)

// استرجاع الورديات المخزنة
const getStoredShifts = (): Shift[] => {
  try {
    const storedShifts = localStorage.getItem("shifts")
    console.log("Current stored shifts:", storedShifts)
    
    if (!storedShifts) return []

    const shifts: Shift[] = JSON.parse(storedShifts)
    // ترتيب الورديات من الأحدث للأقدم
    return shifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error loading shifts:", error)
    return []
  }
}

export function ShiftsProvider({ children }: { children: React.ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>(getStoredShifts)

  // حفظ الورديات في التخزين المحلي عند تغييرها
  useEffect(() => {
    try {
      localStorage.setItem("shifts", JSON.stringify(shifts))
      console.log("Shifts after update:", shifts)
    } catch (error) {
      console.error("Error saving shifts:", error)
    }
  }, [shifts])

  const addShift = (newShift: Omit<Shift, "id" | "createdAt">) => {
    // التحقق من وجود وردية في نفس اليوم ونفس النوع
    const existingShift = shifts.find(
      shift => shift.date === newShift.date && shift.type === newShift.type
    )

    if (existingShift) {
      throw new Error("يوجد وردية مسجلة بالفعل في هذا اليوم ونفس النوع")
    }

    const shift: Shift = {
      ...newShift,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }

    setShifts(prev => {
      // التحقق مرة أخرى قبل الإضافة للتأكد من عدم وجود وردية مماثلة
      const duplicate = prev.find(
        s => s.date === newShift.date && s.type === newShift.type
      )
      if (duplicate) {
        throw new Error("يوجد وردية مسجلة بالفعل في هذا اليوم ونفس النوع")
      }
      return [shift, ...prev]
    })

    return shift
  }

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== id))
  }

  const updateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(shift => 
      shift.id === updatedShift.id ? updatedShift : shift
    ))
  }

  const clearAllShifts = () => {
    setShifts([])
  }

  return (
    <ShiftsContext.Provider value={{ shifts, addShift, deleteShift, updateShift, clearAllShifts }}>
      {children}
    </ShiftsContext.Provider>
  )
}

export function useShifts() {
  const context = useContext(ShiftsContext)
  if (!context) {
    throw new Error("useShifts must be used within a ShiftsProvider")
  }
  return context
}
