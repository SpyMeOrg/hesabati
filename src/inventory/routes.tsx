import { Route, Routes } from "react-router-dom"
import { InventoryLayout } from "./InventoryLayout"
import { InventoryPage } from "./pages/InventoryPage"
import { CategoriesAndUnitsPage } from "./pages/CategoriesAndUnitsPage"
import { StockTakePage } from "./pages/StockTakePage"
import ReportsPage from "./pages/ReportsPage"

export function InventoryRoutes() {
  return (
    <Routes>
      <Route element={<InventoryLayout />}>
        <Route index element={<InventoryPage />} />
        <Route path="categories-and-units" element={<CategoriesAndUnitsPage />} />
        <Route path="stock-take" element={<StockTakePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
