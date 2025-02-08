import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Home,
  Receipt,
  CreditCard,
  Package,
  Settings,
  ChevronDown,
  Boxes,
  ClipboardList,
  BookTemplate,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from "react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon?: any
    label?: string
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const location = useLocation()
  const [isInventoryOpen, setIsInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  )

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "justify-start",
          location.pathname === "/" && "bg-muted hover:bg-muted"
        )}
      >
        <Home className="ml-2 h-4 w-4" />
        الرئيسية
      </Link>

      <Link
        to="/debts"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "justify-start",
          location.pathname.startsWith("/debts") && "bg-muted hover:bg-muted"
        )}
      >
        <Receipt className="ml-2 h-4 w-4" />
        سجل الديون
      </Link>

      <Link
        to="/expenses"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "justify-start",
          location.pathname.startsWith("/expenses") && "bg-muted hover:bg-muted"
        )}
      >
        <CreditCard className="ml-2 h-4 w-4" />
        مصروفات يومية
      </Link>

      <Collapsible
        open={isInventoryOpen}
        onOpenChange={setIsInventoryOpen}
        className="w-full"
      >
        <Link
          to="/inventory"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start w-full group",
            location.pathname === "/inventory" && "bg-muted hover:bg-muted"
          )}
        >
          <Package className="ml-2 h-4 w-4" />
          المخزون
          <ChevronDown
            className={cn(
              "mr-auto h-4 w-4 transition-transform duration-200",
              isInventoryOpen && "rotate-180"
            )}
            onClick={(e) => {
              e.preventDefault()
              setIsInventoryOpen(!isInventoryOpen)
            }}
          />
        </Link>
        <CollapsibleContent className="space-y-1 pr-4">
          <Link
            to="/inventory/products"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start w-full",
              location.pathname === "/inventory/products" &&
                "bg-muted hover:bg-muted"
            )}
          >
            <Boxes className="ml-2 h-4 w-4" />
            المنتجات
          </Link>
          <Link
            to="/inventory/stock-take"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start w-full",
              location.pathname === "/inventory/stock-take" &&
                "bg-muted hover:bg-muted"
            )}
          >
            <ClipboardList className="ml-2 h-4 w-4" />
            الجرد
          </Link>
          <Link
            to="/inventory/templates"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "justify-start w-full",
              location.pathname === "/inventory/templates" &&
                "bg-muted hover:bg-muted"
            )}
          >
            <BookTemplate className="ml-2 h-4 w-4" />
            القوالب
          </Link>
        </CollapsibleContent>
      </Collapsible>

      <Link
        to="/settings"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "justify-start",
          location.pathname === "/settings" && "bg-muted hover:bg-muted"
        )}
      >
        <Settings className="ml-2 h-4 w-4" />
        الإعدادات
      </Link>
    </nav>
  )
}
