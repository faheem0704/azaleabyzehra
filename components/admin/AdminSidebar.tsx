"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Settings, LogOut, Ticket, Menu, X, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/promo-codes", label: "Promo Codes", icon: Ticket },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-ivory/10 flex items-center justify-between">
        <Link href="/" target="_blank" onClick={() => setOpen(false)}>
          <span className="font-playfair text-xl text-ivory">Azalea <span className="text-rose-gold">by Zehra</span></span>
          <p className="font-inter text-xs text-ivory/40 mt-1">Admin Panel</p>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="md:hidden text-ivory/60 hover:text-ivory transition-colors"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 overflow-y-auto">
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
    </>
  );

  return (
    <>
      {/* Hamburger — mobile only, fixed top-left */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-charcoal-dark flex items-center justify-center text-ivory shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay backdrop — mobile only */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-charcoal-dark flex flex-col z-50 transition-transform duration-300",
          // Mobile: slide in/out
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
