"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Settings, LogOut, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-charcoal-dark flex flex-col z-40">
      <div className="p-6 border-b border-ivory/10">
        <Link href="/" target="_blank">
          <span className="font-playfair text-xl text-ivory">Azalea <span className="text-rose-gold">by Zehra</span></span>
        </Link>
        <p className="font-inter text-xs text-ivory/40 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 py-6 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 mb-1 font-inter text-sm transition-all duration-200 rounded-sm",
                active
                  ? "bg-rose-gold text-white"
                  : "text-ivory/60 hover:text-ivory hover:bg-ivory/5"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ivory/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-2 font-inter text-sm text-ivory/50 hover:text-ivory transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
