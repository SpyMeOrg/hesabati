import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react"
import {
  Product,
  Category,
  Unit,
  NewProduct,
  UpdateProduct,
  NewCategory,
  NewUnit,
  InventoryMovement,
  NewInventoryMovement,
  InventoryMovementType,
  ProductStats,
  StockTake,
  NewStockTake
} from "../types"
import { v4 as uuidv4 } from 'uuid'

interface InventoryContextType {
  // المنتجات
  products: Product[]
  addProduct: (product: NewProduct) => Promise<void>
  updateProduct: (id: string, updates: UpdateProduct) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  
  // التصنيفات
  categories: Category[]
  addCategory: (category: NewCategory) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  
  // الوحدات
  units: Unit[]
  addUnit: (unit: NewUnit) => Promise<void>
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  
  // حركات المخزون
  movements: InventoryMovement[]
  addMovement: (movement: NewInventoryMovement) => Promise<void>
  
  // إحصائيات المنتجات
  getProductStats: (productId: string) => ProductStats
  
  // تحديث البيانات
  refreshInventory: () => Promise<void>
  
  // تحرير التصنيفات والوحدات والمنتجات
  editingCategory: Category | null
  setEditingCategory: (category: Category | null) => void
  editingUnit: Unit | null
  setEditingUnit: (unit: Unit | null) => void
  editingProduct: Product | null
  setEditingProduct: (product: Product | null) => void
  
  // إضافة التصنيفات والوحدات والمنتجات
  addUnitOpen: boolean
  setAddUnitOpen: (open: boolean) => void
  addCategoryOpen: boolean
  setAddCategoryOpen: (open: boolean) => void
  addProductOpen: boolean
  setAddProductOpen: (open: boolean) => void
  
  // جرد المخزون
  stockTakeOpen: boolean
  setStockTakeOpen: (open: boolean) => void
  
  // تحرير التصنيفات والوحدات والمنتجات
  handleEditCategory: (category: Category) => void
  handleEditUnit: (unit: Unit) => void
  handleEditProduct: (product: Product) => void
  
  // جرد المخزون
  stockTakes: StockTake[]
  addStockTake: (stockTake: NewStockTake) => Promise<void>
  updateStockTake: (id: string, stockTake: Partial<NewStockTake>) => Promise<void>
  deleteStockTake: (id: string) => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [stockTakes, setStockTakes] = useState<StockTake[]>([])
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [stockTakeOpen, setStockTakeOpen] = useState(false)

  // وظائف إدارة المنتجات
  const addProduct = useCallback(async (product: NewProduct): Promise<void> => {
    const now = new Date().toISOString()
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    setProducts(prev => [...prev, newProduct])
  }, [])

  const updateProduct = useCallback(async (id: string, updates: UpdateProduct): Promise<void> => {
    const product = products.find(p => p.id === id)
    if (!product) {
      throw new Error("المنتج غير موجود")
    }

    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
      return p
    }))
  }, [products])

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    const product = products.find(p => p.id === id)
    if (!product) {
      throw new Error("المنتج غير موجود")
    }

    // التحقق من عدم وجود حركات مخزون للمنتج
    const hasMovements = movements.some(m => m.productId === id)
    if (hasMovements) {
      throw new Error("لا يمكن حذف المنتج لوجود حركات مخزون مرتبطة به")
    }

    setProducts(prev => prev.filter(p => p.id !== id))
  }, [products, movements])

  // وظائف إدارة التصنيفات
  const addCategory = useCallback(async (category: NewCategory): Promise<void> => {
    const now = new Date().toISOString()
    const newCategory: Category = {
      ...category,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    setCategories(prev => [...prev, newCategory])
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>): Promise<void> => {
    const category = categories.find(c => c.id === id)
    if (!category) {
      throw new Error("التصنيف غير موجود")
    }

    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
      return c
    }))
  }, [categories])

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const category = categories.find(c => c.id === id)
    if (!category) {
      throw new Error("التصنيف غير موجود")
    }

    // التحقق من عدم وجود منتجات في التصنيف
    const hasProducts = products.some(p => p.categoryId === id)
    if (hasProducts) {
      throw new Error("لا يمكن حذف التصنيف لوجود منتجات مرتبطة به")
    }

    // التحقق من عدم وجود تصنيفات فرعية
    const hasSubCategories = categories.some(c => c.parentId === id)
    if (hasSubCategories) {
      throw new Error("لا يمكن حذف التصنيف لوجود تصنيفات فرعية تابعة له")
    }

    setCategories(prev => prev.filter(c => c.id !== id))
  }, [products, categories])

  // وظائف إدارة الوحدات
  const addUnit = useCallback(async (unit: NewUnit): Promise<void> => {
    const now = new Date().toISOString()
    const newUnit: Unit = {
      ...unit,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    setUnits(prev => [...prev, newUnit])
  }, [])

  const updateUnit = useCallback(async (id: string, updates: Partial<Unit>): Promise<void> => {
    const unit = units.find(u => u.id === id)
    if (!unit) {
      throw new Error("الوحدة غير موجودة")
    }

    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        return {
          ...u,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
      return u
    }))
  }, [units])

  const deleteUnit = useCallback(async (id: string): Promise<void> => {
    const unit = units.find(u => u.id === id)
    if (!unit) {
      throw new Error("الوحدة غير موجودة")
    }

    // التحقق من عدم وجود منتجات تستخدم الوحدة
    const hasProducts = products.some(p => p.unitId === id)
    if (hasProducts) {
      throw new Error("لا يمكن حذف الوحدة لوجود منتجات تستخدمها")
    }

    setUnits(prev => prev.filter(u => u.id !== id))
  }, [products, units])

  // وظائف إدارة الحركات
  const addMovement = useCallback(async (movement: NewInventoryMovement): Promise<void> => {
    const now = new Date().toISOString()
    const newMovement: InventoryMovement = {
      ...movement,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    setMovements(prev => [...prev, newMovement])

    // تحديث كمية المنتج
    const product = products.find(p => p.id === movement.productId)
    if (product) {
      const newQuantity = movement.type === InventoryMovementType.ADDITION
        ? product.quantity + movement.quantity
        : product.quantity - movement.quantity

      await updateProduct(product.id, { quantity: newQuantity })
    }
  }, [products, updateProduct])

  // وظائف إحصائيات المنتجات
  const getProductStats = useCallback((productId: string): ProductStats => {
    const product = products.find(p => p.id === productId)
    if (!product) {
      throw new Error("المنتج غير موجود")
    }

    const productMovements = movements.filter(m => m.productId === productId)
    const totalIn = productMovements
      .filter(m => m.type === InventoryMovementType.ADDITION)
      .reduce((sum, m) => sum + m.quantity, 0)
    const totalOut = productMovements
      .filter(m => m.type === InventoryMovementType.SUBTRACTION)
      .reduce((sum, m) => sum + m.quantity, 0)
    const lastMovement = productMovements
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const averagePrice = productMovements
      .reduce((sum, m) => sum + m.price, 0) / (productMovements.length || 1)

    return {
      productId,
      productName: product.name,
      totalIn,
      totalOut,
      currentStock: product.quantity,
      averagePrice,
      totalValue: product.quantity * product.price,
      lastMovement: lastMovement?.createdAt,
      movementCount: productMovements.length
    }
  }, [products, movements])

  // وظيفة تحديث البيانات
  const refreshInventory = useCallback(async (): Promise<void> => {
    // يمكن إضافة منطق لتحديث البيانات من مصدر خارجي هنا
  }, [])

  // وظائف تحرير العناصر
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setAddCategoryOpen(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setAddUnitOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setAddProductOpen(true)
  }

  // وظائف إدارة الجرد
  const addStockTake = async (stockTake: NewStockTake) => {
    const newStockTake: StockTake = {
      ...stockTake,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setStockTakes(prev => [...prev, newStockTake])
  }

  const updateStockTake = async (id: string, stockTake: Partial<NewStockTake>) => {
    setStockTakes(prev => prev.map(st => 
      st.id === id 
        ? { ...st, ...stockTake, updatedAt: new Date().toISOString() }
        : st
    ))
  }

  const deleteStockTake = async (id: string) => {
    setStockTakes(prev => prev.filter(st => st.id !== id))
  }

  // القيمة المصدرة للسياق
  const value = useMemo(() => ({
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    movements,
    addMovement,
    getProductStats,
    refreshInventory,
    editingCategory,
    setEditingCategory,
    editingUnit,
    setEditingUnit,
    editingProduct,
    setEditingProduct,
    addUnitOpen,
    setAddUnitOpen,
    addCategoryOpen,
    setAddCategoryOpen,
    addProductOpen,
    setAddProductOpen,
    stockTakeOpen,
    setStockTakeOpen,
    handleEditCategory,
    handleEditUnit,
    handleEditProduct,
    stockTakes,
    addStockTake,
    updateStockTake,
    deleteStockTake
  }), [
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    movements,
    addMovement,
    getProductStats,
    refreshInventory,
    editingCategory,
    editingUnit,
    editingProduct,
    addUnitOpen,
    addCategoryOpen,
    addProductOpen,
    stockTakeOpen,
    stockTakes,
    addStockTake,
    updateStockTake,
    deleteStockTake
  ])

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}
