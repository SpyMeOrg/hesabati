import { Outlet } from "react-router-dom"
import { InventorySidebar } from "./components/InventorySidebar"

export function InventoryLayout() {
  return (
    <div className="flex h-screen">
      {/* القائمة الجانبية */}
      <div className="w-64 border-l bg-background">
        <InventorySidebar />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
