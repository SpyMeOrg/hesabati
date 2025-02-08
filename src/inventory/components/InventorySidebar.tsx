import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function InventorySidebar() {
  return (
    <div className="space-y-2 py-4" dir="rtl">
      <NavLink to="/inventory" end>
        {({ isActive }) => (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <i className="fas fa-box ml-2"></i>
            المنتجات
          </Button>
        )}
      </NavLink>

      <NavLink to="/inventory/categories-and-units">
        {({ isActive }) => (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <i className="fas fa-tags ml-2"></i>
            التصنيفات والوحدات
          </Button>
        )}
      </NavLink>

      <NavLink to="/inventory/stock-take">
        {({ isActive }) => (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <i className="fas fa-clipboard-list ml-2"></i>
            جرد المخزون
          </Button>
        )}
      </NavLink>

      <NavLink to="/inventory/reports">
        {({ isActive }) => (
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <i className="fas fa-chart-bar ml-2"></i>
            التقارير والإحصائيات
          </Button>
        )}
      </NavLink>
    </div>
  )
}
