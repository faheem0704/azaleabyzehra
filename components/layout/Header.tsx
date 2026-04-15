"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Search, Menu, X, ChevronDown, User, LogOut, Package, Settings, LayoutDashboard } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useUIStore } from "@/store/uiStore";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  const cartCount = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.totalItems());
  const { isMobileMenuOpen, isSearchOpen, openMobileMenu, closeMobileMenu, openSearch, closeSearch } = useUIStore();
  const openCart = useCartStore((s) => s.openCart);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen || isSearchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Close account dropdown on click outside
  useEffect(() => {
    if (!isAccountOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountOpen]);

  const navLinks = [
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Orders", href: "/orders" },
    { label: "Help", href: "/help" },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-ivory/95 backdrop-blur-md shadow-sm border-b border-ivory-200"
            : "bg-transparent"
        )}
      >
        <div className="section-padding">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <motion.div whileHover={{ scale: 1.02 }}>
                <span className="font-playfair text-2xl text-charcoal tracking-wide">
                  Azalea <span className="text-rose-gold">by Zehra</span>
                </span>
              </motion.div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {/* Products Mega Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredCategory("products")}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button className="flex items-center gap-1 font-inter text-sm tracking-wide text-charcoal hover:text-rose-gold transition-colors duration-200">
                  Products
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform duration-200", hoveredCategory === "products" && "rotate-180")}
                  />
                </button>

                <AnimatePresence>
                  {hoveredCategory === "products" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[480px]"
                    >
                      <div className="bg-ivory border border-ivory-200 shadow-xl p-6 grid grid-cols-2 gap-6">
                        <div>
                          <p className="section-subtitle text-xs mb-4">Collections</p>
                          <ul className="space-y-2">
                            {categories.filter((c) => !c.parentId).map((cat) => (
                              <li key={cat.id}>
                                <Link
                                  href={`/products?category=${cat.slug}`}
                                  className="font-inter text-sm text-charcoal hover:text-rose-gold transition-colors duration-200 link-hover"
                                >
                                  {cat.name}
                                </Link>
                                {cat.children && cat.children.length > 0 && (
                                  <ul className="ml-3 mt-1 space-y-1">
                                    {cat.children.map((child) => (
                                      <li key={child.id}>
                                        <Link
                                          href={`/products?category=${child.slug}`}
                                          className="font-inter text-xs text-charcoal-light hover:text-rose-gold transition-colors duration-200"
                                        >
                                          {child.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="border-l border-ivory-200 pl-6">
                          <p className="section-subtitle text-xs mb-4">Quick Links</p>
                          <ul className="space-y-2">
                            <li><Link href="/products?featured=true" className="font-inter text-sm text-charcoal hover:text-rose-gold transition-colors">Featured</Link></li>
                            <li><Link href="/new-arrivals" className="font-inter text-sm text-charcoal hover:text-rose-gold transition-colors">New Arrivals</Link></li>
                            <li><Link href="/products?sort=popular" className="font-inter text-sm text-charcoal hover:text-rose-gold transition-colors">Best Sellers</Link></li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-inter text-sm tracking-wide text-charcoal hover:text-rose-gold transition-colors duration-200 link-hover"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openSearch}
                className="text-charcoal hover:text-rose-gold transition-colors duration-200"
              >
                <Search size={20} />
              </motion.button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative text-charcoal hover:text-rose-gold transition-colors duration-200">
                <motion.div whileHover={{ scale: 1.1 }}>
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 h-4 w-4 bg-rose-gold text-white text-[10px] font-inter font-bold rounded-full flex items-center justify-center"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative text-charcoal hover:text-rose-gold transition-colors duration-200"
              >
                <motion.div whileHover={{ scale: 1.1 }}>
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 h-4 w-4 bg-rose-gold text-white text-[10px] font-inter font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.div>
              </button>

              {/* Account */}
              <div ref={accountRef} className="relative hidden lg:block">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="text-charcoal hover:text-rose-gold transition-colors duration-200"
                >
                  <User size={20} />
                </motion.button>

                <AnimatePresence>
                  {isAccountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-ivory border border-ivory-200 shadow-lg py-2"
                    >
                      {session ? (
                        <>
                          <div className="px-4 py-2 border-b border-ivory-200">
                            <p className="text-xs font-inter text-charcoal-light truncate">
                              {session.user?.name || session.user?.email}
                            </p>
                            {isAdmin && (
                              <span className="mt-1 inline-block text-[10px] font-inter tracking-widest uppercase text-rose-gold">
                                Admin
                              </span>
                            )}
                          </div>
                          {isAdmin ? (
                            // Admin sees a shortcut to the admin panel, not customer links
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                              onClick={() => setIsAccountOpen(false)}
                            >
                              <LayoutDashboard size={14} />
                              Admin Panel
                            </Link>
                          ) : (
                            <>
                              <Link
                                href="/orders"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                                onClick={() => setIsAccountOpen(false)}
                              >
                                <Package size={14} />
                                My Orders
                              </Link>
                              <Link
                                href="/account"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                                onClick={() => setIsAccountOpen(false)}
                              >
                                <Settings size={14} />
                                My Account
                              </Link>
                            </>
                          )}
                          <button
                            onClick={() => { signOut(); setIsAccountOpen(false); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/login"
                            className="block px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                            onClick={() => setIsAccountOpen(false)}
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            className="block px-4 py-2 text-sm font-inter text-charcoal hover:text-rose-gold hover:bg-ivory-200 transition-colors"
                            onClick={() => setIsAccountOpen(false)}
                          >
                            Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={openMobileMenu}
                className="lg:hidden text-charcoal hover:text-rose-gold transition-colors"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ivory/98 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <button
              onClick={closeSearch}
              className="absolute top-6 right-6 text-charcoal hover:text-rose-gold transition-colors"
            >
              <X size={24} />
            </button>
            <div className="w-full max-w-2xl px-6">
              <p className="section-subtitle text-center mb-8">Search</p>
              <div className="flex items-center border-b-2 border-charcoal pb-4">
                <Search size={20} className="text-mauve mr-4 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      closeSearch();
                      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                    if (e.key === "Escape") closeSearch();
                  }}
                  placeholder="Search kurtis, sets, dupattas…"
                  className="flex-1 bg-transparent text-2xl font-playfair text-charcoal placeholder-mauve focus:outline-none"
                />
              </div>
              <p className="mt-4 text-center text-xs font-inter text-mauve tracking-widest">
                Press Enter to search · Esc to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed inset-0 z-[60] bg-ivory flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-20 border-b border-ivory-200">
              <span className="font-playfair text-2xl text-charcoal">
                Azalea <span className="text-rose-gold">by Zehra</span>
              </span>
              <button onClick={closeMobileMenu} className="text-charcoal">
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-8">
              <motion.ul className="space-y-1">
                {[
                  { label: "All Products", href: "/products" },
                  { label: "New Arrivals", href: "/new-arrivals" },
                  ...categories.map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })),
                  { label: "Orders", href: "/orders" },
                  { label: "Wishlist", href: "/wishlist" },
                  { label: "Help", href: "/help" },
                ].map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="block py-3 font-inter text-lg text-charcoal hover:text-rose-gold transition-colors border-b border-ivory-200"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="mt-8 pt-8 border-t border-ivory-200">
                {session ? (
                  <>
                    <p className="text-xs font-inter text-mauve mb-1">
                      {session.user?.name || session.user?.email}
                    </p>
                    {isAdmin && (
                      <span className="inline-block text-[10px] font-inter tracking-widest uppercase text-rose-gold mb-4">Admin</span>
                    )}
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 text-sm font-inter text-charcoal hover:text-rose-gold mb-3"
                      >
                        <LayoutDashboard size={16} />
                        Admin Panel
                      </Link>
                    ) : (
                      <>
                        <Link href="/orders" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm font-inter text-charcoal hover:text-rose-gold mb-3">
                          <Package size={16} />
                          My Orders
                        </Link>
                        <Link href="/account" onClick={closeMobileMenu} className="flex items-center gap-2 text-sm font-inter text-charcoal hover:text-rose-gold mb-3">
                          <Settings size={16} />
                          My Account
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { signOut(); closeMobileMenu(); }}
                      className="flex items-center gap-2 text-sm font-inter text-charcoal hover:text-rose-gold"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <Link href="/login" onClick={closeMobileMenu} className="btn-primary text-xs py-2.5 px-6">
                      Sign In
                    </Link>
                    <Link href="/register" onClick={closeMobileMenu} className="btn-outline text-xs py-2.5 px-6">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
