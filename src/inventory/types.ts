/**
 * نماذج البيانات الأساسية لنظام المخزون
 */

/**
 * أنواع حركات المخزون
 */
export enum InventoryMovementType {
  ADDITION = 'إضافة',
  SUBTRACTION = 'سحب',
  ADJUSTMENT = 'تعديل',
  STOCKTAKE = 'جرد'
}

/**
 * نموذج الوحدة (مثل: كيلو، قطعة، شيكارة)
 */
export interface Unit {
  id: string
  name: string
  symbol?: string
  createdAt: string
  updatedAt: string
}

/**
 * نموذج التصنيف الأساسي
 */
export interface BaseCategory {
  name: string
  description?: string
  parentId?: string
  isSubcategory?: boolean
}

/**
 * نموذج التصنيف الكامل
 */
export interface Category extends BaseCategory {
  id: string
  createdAt: string
  updatedAt: string
}

/**
 * نموذج المنتج
 */
export interface Product {
  id: string
  name: string
  categoryId: string
  description?: string
  unitId: string
  price: number
  quantity: number
  minQuantity?: number
  createdAt: string
  updatedAt: string
  expiryDate?: string
  isPerishable?: boolean
}

/**
 * نموذج حركة المخزون الموحد
 */
export interface InventoryMovement {
  id: string
  productId: string
  type: InventoryMovementType
  quantity: number
  oldQuantity: number
  newQuantity: number
  price: number
  userId: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * نموذج إضافة حركة مخزون جديدة
 */
export interface NewInventoryMovement {
  productId: string
  type: InventoryMovementType
  quantity: number
  oldQuantity: number
  newQuantity: number
  price: number
  userId: string
  notes?: string
}

/**
 * نموذج إحصائيات المنتج
 */
export interface ProductStats {
  productId: string
  productName: string
  totalIn: number
  totalOut: number
  currentStock: number
  averagePrice: number
  totalValue: number
  lastMovement?: string
  movementCount: number
}

/**
 * نموذج تقرير المخزون
 */
export interface InventoryReport {
  id: string
  type: 'daily' | 'weekly' | 'monthly'
  startDate: string
  endDate: string
  totalProducts: number
  totalValue: number
  lowStockProducts: number
  expiringProducts: number
  topMovingProducts: ProductStats[]
  leastMovingProducts: ProductStats[]
  movements: InventoryMovement[]
  createdAt: string
}

// نماذج الإضافة والتحديث
export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProduct = Partial<NewProduct>
export type NewCategory = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
export type NewUnit = Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>

/**
 * نموذج تصدير/استيراد Excel
 */
export interface ExcelProduct {
  الاسم: string
  التصنيف: string
  الوصف?: string
  الوحدة: string
  السعر: number
  الكمية: number
  'الحد الأدنى للكمية'?: number
  'تاريخ الصلاحية'?: string
  'قابل للتلف'?: boolean
}

/**
 * القوالب الافتراضية
 */
export const defaultTemplates: Record<string, ProductTemplate> = {
  koshary: {
    id: "koshary",
    name: "مطعم كشري",
    description: "قالب لإدارة مخزون مطعم كشري",
    categories: [
      {
        id: "1",
        name: "مواد خام",
        description: "المكونات الأساسية للكشري"
      },
      {
        id: "2",
        name: "منتجات",
        description: "الأطباق الجاهزة"
      }
    ],
    units: [
      {
        id: "1",
        name: "كيلو",
        symbol: "كج"
      },
      {
        id: "2",
        name: "جرام",
        symbol: "ج"
      },
      {
        id: "3",
        name: "طبق",
      }
    ]
  }
}

/**
 * نموذج القالب
 */
export interface ProductTemplate {
  id: string
  name: string
  description?: string
  categories: TemplateCategory[]
  units: TemplateUnit[]
  products?: TemplateProduct[]
}

/**
 * نماذج مساعدة للقوالب
 */
export interface TemplateCategory {
  id: string
  name: string
  description?: string
}

export interface TemplateUnit {
  id: string
  name: string
  symbol?: string
}

export interface TemplateProduct {
  name: string
  description?: string
  price: number
  quantity: number
  minQuantity?: number
  categoryName: string
  unitName: string
  expiryDate?: string
  isPerishable?: boolean
}

/**
 * نموذج عنصر الجرد
 */
export interface StockTakeItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

/**
 * نموذج الجرد
 */
export interface StockTake {
  id: string
  date: string
  items: StockTakeItem[]
  notes?: string
  status: 'pending' | 'completed'
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * نموذج إضافة جرد جديد
 */
export type NewStockTake = Omit<StockTake, 'id' | 'createdAt' | 'updatedAt'>

/**
 * نموذج حركة المنتج
 */
export type ProductMovement = {
  id: string
  productId: string
  type: 'edit' | 'stock' | 'delete'  // نوع الحركة: تعديل، حركة مخزون، حذف
  description: string  // وصف الحركة
  oldValue?: string  // القيمة القديمة (للتعديل)
  newValue?: string  // القيمة الجديدة (للتعديل)
  quantity?: number  // الكمية (لحركة المخزون)
  userId: string  // معرف المستخدم الذي قام بالحركة
  createdAt: string  // تاريخ الحركة
}
