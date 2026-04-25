"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Star, Sparkles, Download, AlertTriangle, Search } from "lucide-react";
import { Product, Category, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";
import { COLOR_FAMILIES } from "@/lib/colorFamilies";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import VariantStockGrid from "@/components/admin/products/VariantStockGrid";
import ProductImageManager, { type ImageEntry } from "@/components/admin/products/ProductImageManager";
import toast from "react-hot-toast";

interface Props {
  initialProducts: Product[];
  categories: Category[];
  lowStockThreshold: number;
  totalCount: number;
}

const EMPTY_FORM = {
  name: "", description: "", price: "", compareAtPrice: "",
  categoryId: "", sizes: "S,M,L,XL", colors: "Black,White",
  fabric: "", featured: false, isNewArrival: false, isOnSale: false,
};

const vkey = (size: string, color: string) => `${size}||${color}`;

const LIMIT = 20;

export default function AdminProductsClient({ initialProducts, categories, lowStockThreshold, totalCount }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filteredTotal, setFilteredTotal] = useState(totalCount);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Refs for observer callback — readable synchronously without waiting for a re-render
  const hasMoreRef = useRef(initialProducts.length < totalCount);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  // Synchronous lock set before the async fetch begins — prevents the observer from
  // calling fetchMore while a filter-reset fetch is already in flight (#2)
  const isResettingRef = useRef(false);
  // Separate loading state for filter-change fetches (#7)
  const [isFiltering, setIsFiltering] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [colorFamilies, setColorFamilies] = useState<string[]>([]);
  const [variantStock, setVariantStock] = useState<Record<string, number>>({});
  const [variantSku, setVariantSku] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // Fix 9: save lock ref to prevent double-save race
  const saveLockRef = useRef<boolean>(false);

  const buildQueryString = useCallback((nextPage: number, overrides?: {
    search?: string; categoryId?: string; status?: string;
    minPrice?: string; maxPrice?: string; sort?: string;
  }) => {
    const s = overrides?.search      ?? debouncedSearch;
    const c = overrides?.categoryId  ?? categoryFilter;
    const st = overrides?.status     ?? statusFilter;
    const mn = overrides?.minPrice   ?? minPrice;
    const mx = overrides?.maxPrice   ?? maxPrice;
    const so = overrides?.sort       ?? sortBy;
    const params = new URLSearchParams({ page: String(nextPage), limit: String(LIMIT) });
    if (s)  params.set("search", s);
    if (c)  params.set("categoryId", c);
    if (st) params.set("status", st);
    if (mn) params.set("minPrice", mn);
    if (mx) params.set("maxPrice", mx);
    if (so !== "newest") params.set("sort", so);
    return params.toString();
  }, [debouncedSearch, categoryFilter, statusFilter, minPrice, maxPrice, sortBy]);

  const fetchMore = useCallback(async (nextPage: number) => {
    // Guard via ref — synchronously readable, no re-render needed
    if (loadingMoreRef.current || isResettingRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/admin/products?${buildQueryString(nextPage)}`);
      if (!res.ok) return;
      const data = await res.json();
      setProducts((prev) => [...prev, ...data.products]);
      setFilteredTotal(data.totalCount);
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
      setPage(nextPage);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [buildQueryString]);

  // Observer is created once and never reconnected — guards read refs synchronously (#8)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current && !isResettingRef.current) {
          fetchMore(pageRef.current + 1);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  // fetchMore is stable (only rebuilds when buildQueryString changes, i.e. when filters change)
  }, [fetchMore]);

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  // Reset list when any filter changes (including debounced search) (#3: uses buildQueryString)
  useEffect(() => {
    const resetAndFetch = async () => {
      // Set the ref synchronously BEFORE any await — prevents the observer from calling
      // fetchMore for page 2 while this fetch is still in flight (#2)
      isResettingRef.current = true;
      setIsFiltering(true);
      try {
        const res = await fetch(`/api/admin/products?${buildQueryString(1)}`);
        if (!res.ok) return;
        const data = await res.json();
        setProducts(data.products);
        setFilteredTotal(data.totalCount);
        hasMoreRef.current = data.hasMore;
        setHasMore(data.hasMore);
        pageRef.current = 1;
        setPage(1);
      } finally {
        isResettingRef.current = false;
        setIsFiltering(false);
      }
    };
    resetAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter, statusFilter, minPrice, maxPrice, sortBy]);

  const parsedSizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  const parsedColors = form.colors.split(",").map((c) => c.trim()).filter(Boolean);

  // Rebuild variant map when sizes/colors change — preserve existing stock values.
  // Accepts current stock/sku maps as parameters so callers inside setForm functional
  // updaters can pass the latest state rather than the stale render-time closure values.
  const buildVariantMap = (
    sizes: string[],
    colors: string[],
    currentStock: Record<string, number>,
    currentSku: Record<string, string>,
  ) => {
    const newStock: Record<string, number> = {};
    const newSku: Record<string, string> = {};
    for (const s of sizes) {
      for (const c of colors) {
        const k = vkey(s, c);
        newStock[k] = currentStock[k] ?? (editingProduct ? 0 : 3);
        newSku[k] = currentSku[k] ?? "";
      }
    }
    setVariantStock(newStock);
    setVariantSku(newSku);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setImages([]);
    setColorFamilies([]);
    const sizes = EMPTY_FORM.sizes.split(",").map(s => s.trim()).filter(Boolean);
    const colors = EMPTY_FORM.colors.split(",").map(c => c.trim()).filter(Boolean);
    const stock: Record<string, number> = {};
    const sku: Record<string, string> = {};
    for (const s of sizes) for (const c of colors) { stock[vkey(s, c)] = 3; sku[vkey(s, c)] = ""; }
    setVariantStock(stock);
    setVariantSku(sku);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() || "", categoryId: p.categoryId,
      sizes: p.sizes.join(","), colors: p.colors.join(","),
      fabric: p.fabric || "", featured: p.featured, isNewArrival: p.isNewArrival, isOnSale: p.isOnSale ?? false,
    });
    const colorImgs = (p.colorImages ?? {}) as Record<string, string[]>;
    const urlToColor: Record<string, string> = {};
    for (const [color, urls] of Object.entries(colorImgs)) {
      for (const url of urls) urlToColor[url] = color;
    }
    setImages(p.images.map((url, i) => ({ url, alt: p.imageAlts?.[i] ?? "", colorTag: urlToColor[url] ?? "" })));

    const stock: Record<string, number> = {};
    const sku: Record<string, string> = {};
    for (const s of p.sizes) for (const c of p.colors) { stock[vkey(s, c)] = 0; sku[vkey(s, c)] = ""; }
    // Only use variant data if variants exist AND their total stock is > 0.
    // If all variants have stock=0 but product.stock > 0, the variant rows are stale/corrupt
    // — fall through to the even-distribution fallback so the admin sees real inventory.
    const variantTotalStock = p.variants?.reduce((s, v) => s + v.stock, 0) ?? 0;
    if (p.variants && p.variants.length > 0 && variantTotalStock > 0) {
      for (const v of p.variants) { stock[vkey(v.size, v.color)] = v.stock; sku[vkey(v.size, v.color)] = v.sku ?? ""; }
    } else if (p.stock > 0) {
      // No variant rows exist yet, or all variants show 0 while product.stock > 0
      // (e.g. product created via CSV before variant tracking, or stale variant data).
      // Distribute total stock evenly across all size×color combinations so the admin
      // sees the real inventory rather than zeros.
      const cellCount = p.sizes.length * p.colors.length;
      if (cellCount > 0) {
        const perCell = Math.floor(p.stock / cellCount);
        const remainder = p.stock % cellCount;
        let i = 0;
        for (const s of p.sizes) {
          for (const c of p.colors) {
            stock[vkey(s, c)] = perCell + (i === 0 ? remainder : 0);
            i++;
          }
        }
      }
    }
    setColorFamilies(p.colorFamilies ?? []);
    setVariantStock(stock);
    setVariantSku(sku);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Fix 11: name missing fields in validation toast
    const missingFields: string[] = [];
    if (!form.name) missingFields.push("Product Name");
    if (!form.price) missingFields.push("Price");
    if (!form.categoryId) missingFields.push("Category");
    if (missingFields.length > 0) {
      toast.error(`Required: ${missingFields.join(", ")}`);
      return;
    }

    // Fix 9: synchronous lock check — prevents double-save race
    if (saveLockRef.current) return;
    saveLockRef.current = true;
    setSaving(true);

    try {
      const variants = parsedSizes.flatMap((size) =>
        parsedColors.map((color) => ({
          size, color,
          stock: variantStock[vkey(size, color)] ?? 0,
          sku: variantSku[vkey(size, color)] || undefined,
        }))
      );
      const totalStock = variants.reduce((s, v) => s + v.stock, 0);

      const body = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        categoryId: form.categoryId,
        sizes: parsedSizes,
        colors: parsedColors,
        colorFamilies,
        fabric: form.fabric || null,
        stock: totalStock,
        featured: form.featured,
        isNewArrival: form.isNewArrival,
        isOnSale: form.isOnSale,
        images: images.map((i) => i.url),
        imageAlts: images.map((i) => i.alt),
        colorImages: (() => {
          const map: Record<string, string[]> = {};
          for (const img of images) {
            if (img.colorTag && parsedColors.includes(img.colorTag)) {
              if (!map[img.colorTag]) map[img.colorTag] = [];
              map[img.colorTag].push(img.url);
            }
          }
          return Object.keys(map).length > 0 ? map : null;
        })(),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);

      // Save variants
      const variantRes = await fetch(`/api/products/${saved.id}/variants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });
      // Parse body exactly once — Response.body is a single-use stream
      const variantBody = await variantRes.json().catch(() => ({}));
      if (!variantRes.ok) {
        throw new Error((variantBody as { error?: string }).error || "Failed to save variant stock");
      }

      // Fix 7: use DB-returned variants (with IDs) for local state
      const savedVariants: ProductVariant[] = Array.isArray(variantBody) ? variantBody : (variants as ProductVariant[]);

      if (editingProduct) {
        setProducts((prev) => prev.map((p) =>
          p.id === saved.id
            // Preserve the category object from existing local state — the PUT response does not
            // include a category relation. Spreading `saved` last would overwrite `p.category` with
            // undefined because the product update endpoint returns only the flat product row.
            ? { ...p, ...saved, category: p.category, variants: savedVariants }
            : p
        ));
        toast.success("Product updated");
      } else {
        // For new products the category relation is not in the server response either.
        // Look it up from the categories prop so the table shows the correct category name.
        const matchedCategory = categories.find((c) => c.id === saved.categoryId);
        setProducts((prev) => [{ ...saved, category: matchedCategory ?? null, variants: savedVariants }, ...prev]);
        toast.success("Product created");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    // BUG-30: check response before updating local state
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to delete product");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const handleCSVExport = () => {
    // BUG-34 (intentional): window.location.href is correct here — file downloads
    // require a full browser navigation to trigger the Content-Disposition header.
    // router.push() would attempt a client-side fetch and silently discard the file.
    window.location.href = "/api/admin/csv/export";
  };

  const hasActiveFilters = search !== "" || categoryFilter !== "" || statusFilter !== "" || minPrice !== "" || maxPrice !== "" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  // BUG-25: use settings lowStockThreshold instead of hardcoded 5
  // Use strict < to match the API's `lt` operator — a product at exactly the threshold
  // is NOT considered low stock (consistent with ?status=lowStock filter)
  const isLowStock = (p: Product) => {
    if (p.variants && p.variants.length > 0) {
      return p.variants.some((v) => v.stock > 0 && v.stock < lowStockThreshold);
    }
    return p.stock > 0 && p.stock < lowStockThreshold;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-playfair text-3xl text-charcoal">Products</h1>
          <p className="font-inter text-sm text-charcoal-light mt-1">{filteredTotal} products</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 px-4 py-2 border border-ivory-200 font-inter text-xs tracking-widest uppercase text-charcoal-light hover:border-charcoal hover:text-charcoal transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-ivory-200 p-4 mb-6">
        {/* Search input */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full border border-ivory-200 pl-9 pr-4 py-2.5 text-sm font-inter text-charcoal placeholder:text-mauve focus:outline-none focus:border-rose-gold rounded-lg"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-charcoal">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter strip */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-ivory-200 rounded-lg px-3 py-2 text-sm font-inter text-charcoal focus:outline-none focus:border-rose-gold bg-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-ivory-200 rounded-lg px-3 py-2 text-sm font-inter text-charcoal focus:outline-none focus:border-rose-gold bg-white"
          >
            <option value="">All statuses</option>
            <option value="featured">Featured</option>
            <option value="newArrival">New Arrival</option>
            <option value="onSale">On Sale</option>
            <option value="lowStock">Low Stock</option>
          </select>

          {/* Price range */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min ₹"
              min={0}
              className="w-20 border border-ivory-200 rounded-lg px-2.5 py-2 text-sm font-inter text-charcoal placeholder:text-mauve focus:outline-none focus:border-rose-gold"
            />
            <span className="text-mauve text-sm font-inter">–</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max ₹"
              min={0}
              className="w-20 border border-ivory-200 rounded-lg px-2.5 py-2 text-sm font-inter text-charcoal placeholder:text-mauve focus:outline-none focus:border-rose-gold"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-ivory-200 rounded-lg px-3 py-2 text-sm font-inter text-charcoal focus:outline-none focus:border-rose-gold bg-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priceAsc">Price ↑</option>
            <option value="priceDesc">Price ↓</option>
            <option value="nameAsc">Name A–Z</option>
            <option value="nameDesc">Name Z–A</option>
            <option value="stockAsc">Stock ↑</option>
            <option value="stockDesc">Stock ↓</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-inter text-mauve hover:text-charcoal border border-ivory-200 rounded-lg transition-colors"
            >
              <X size={13} />
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto font-inter text-xs text-mauve whitespace-nowrap">
            Showing {products.length} of {filteredTotal} products
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white border border-ivory-200 overflow-hidden relative transition-opacity duration-150 ${isFiltering ? "opacity-60 pointer-events-none" : ""}`}>
        {isFiltering && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-ivory-200 overflow-hidden z-10">
            <div className="h-full bg-rose-gold animate-pulse" style={{ width: "60%" }} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ivory-200">
              <tr>
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-ivory-200/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 flex-shrink-0 bg-ivory-200 overflow-hidden">
                        {p.images[0] && <img src={p.images[0]} alt={p.imageAlts?.[0] || p.name} className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-inter text-sm text-charcoal line-clamp-1 max-w-[200px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-inter text-xs text-mauve">{(p as any).category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-inter text-sm text-charcoal">{formatPrice(p.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {isLowStock(p) && <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />}
                      <span className={`font-inter text-sm ${p.stock === 0 ? "text-red-500" : isLowStock(p) ? "text-amber-500" : "text-charcoal"}`}>
                        {p.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {p.featured && <span className="text-[10px] font-inter bg-rose-gold/10 text-rose-gold px-2 py-0.5">Featured</span>}
                      {p.isNewArrival && <span className="text-[10px] font-inter bg-charcoal/10 text-charcoal px-2 py-0.5">New</span>}
                      {(p as any).isOnSale && <span className="text-[10px] font-inter bg-red-100 text-red-600 px-2 py-0.5">Sale</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-charcoal-light hover:text-rose-gold transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-charcoal-light hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="font-inter text-sm text-mauve">
                {hasActiveFilters ? "No products match your filters." : "No products yet. Add your first product!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-6 flex justify-center min-h-[32px]">
        {loadingMore && (
          <div className="w-5 h-5 border-2 border-ivory-200 border-t-rose-gold rounded-full animate-spin" />
        )}
        {!hasMore && products.length > 0 && (
          <p className="font-inter text-xs text-mauve">All {filteredTotal} products loaded</p>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Fix 9: disable backdrop click while save is in-flight — use saveLockRef (synchronous) not saving state (async) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!saveLockRef.current) setIsModalOpen(false); }} className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed inset-4 md:inset-8 z-[80] bg-ivory overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between px-8 py-5 border-b border-ivory-200 sticky top-0 bg-ivory z-10">
                <h2 className="font-playfair text-2xl text-charcoal">{editingProduct ? "Edit Product" : "New Product"}</h2>
                <button onClick={() => { if (!saveLockRef.current) setIsModalOpen(false); }} className="text-charcoal-light hover:text-charcoal disabled:opacity-30" disabled={saving}><X size={20} /></button>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left — Product Info */}
                <div className="space-y-5">
                  <Input label="Product Name *" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Elegant Lawn Kurti" />
                  <div>
                    <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={4}
                      placeholder="Beautiful hand-crafted kurti..."
                      className="w-full border border-ivory-200 px-4 py-3 text-sm font-inter focus:outline-none focus:border-rose-gold resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="2499" />
                    <Input label="Compare At Price" type="number" value={form.compareAtPrice} onChange={(e) => setForm(p => ({ ...p, compareAtPrice: e.target.value }))} placeholder="3499" />
                  </div>
                  <div>
                    <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Category *</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full border border-ivory-200 px-4 py-3 text-sm font-inter focus:outline-none focus:border-rose-gold bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Sizes (comma-separated)"
                      value={form.sizes}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Capture current stock/sku before entering setForm so buildVariantMap
                        // always receives the latest maps, not the stale render-time closure.
                        const snapStock = variantStock;
                        const snapSku = variantSku;
                        setForm(p => {
                          const freshColors = p.colors.split(",").map(c => c.trim()).filter(Boolean);
                          const sizes = val.split(",").map(s => s.trim()).filter(Boolean);
                          buildVariantMap(sizes, freshColors, snapStock, snapSku);
                          return { ...p, sizes: val };
                        });
                      }}
                      placeholder="S,M,L,XL,XXL"
                    />
                    <Input
                      label="Colors (comma-separated)"
                      value={form.colors}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Capture current stock/sku before entering setForm so buildVariantMap
                        // always receives the latest maps, not the stale render-time closure.
                        const snapStock = variantStock;
                        const snapSku = variantSku;
                        setForm(p => {
                          const freshSizes = p.sizes.split(",").map(s => s.trim()).filter(Boolean);
                          const colors = val.split(",").map(c => c.trim()).filter(Boolean);
                          buildVariantMap(freshSizes, colors, snapStock, snapSku);
                          return { ...p, colors: val };
                        });
                      }}
                      placeholder="Black,White,Navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Color Families</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_FAMILIES.map((family) => (
                        <button
                          key={family}
                          type="button"
                          onClick={() => setColorFamilies((prev) =>
                            prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family]
                          )}
                          className={`px-3 py-1.5 text-xs font-inter border transition-all duration-200 ${
                            colorFamilies.includes(family)
                              ? "border-rose-gold bg-rose-gold text-white"
                              : "border-ivory-200 text-charcoal-light hover:border-rose-gold hover:text-rose-gold"
                          }`}
                        >
                          {family}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input label="Fabric" value={form.fabric} onChange={(e) => setForm(p => ({ ...p, fabric: e.target.value }))} placeholder="Lawn Cotton" />

                  {/* Variant Stock Grid */}
                  {parsedSizes.length > 0 && parsedColors.length > 0 && (
                    <VariantStockGrid
                      sizes={parsedSizes}
                      colors={parsedColors}
                      variantStock={variantStock}
                      variantSku={variantSku}
                      onStockChange={(k, v) => setVariantStock((prev) => ({ ...prev, [k]: v }))}
                      onSkuChange={(k, v) => setVariantSku((prev) => ({ ...prev, [k]: v }))}
                    />
                  )}

                  <div className="flex gap-6 flex-wrap">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-rose-gold" />
                      <span className="font-inter text-sm text-charcoal flex items-center gap-1"><Star size={14} className="text-rose-gold" /> Featured</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm(p => ({ ...p, isNewArrival: e.target.checked }))} className="w-4 h-4 accent-rose-gold" />
                      <span className="font-inter text-sm text-charcoal flex items-center gap-1"><Sparkles size={14} className="text-rose-gold" /> New Arrival</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.isOnSale} onChange={(e) => setForm(p => ({ ...p, isOnSale: e.target.checked }))} className="w-4 h-4 accent-red-500" />
                      <span className="font-inter text-sm text-red-600 flex items-center gap-1">On Sale</span>
                    </label>
                  </div>
                </div>

                {/* Right — Images with reordering + alt text */}
                <div>
                  <ProductImageManager
                    images={images}
                    setImages={setImages}
                    parsedColors={parsedColors}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 px-8 py-6 border-t border-ivory-200 sticky bottom-0 bg-ivory">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} loading={saving}>{editingProduct ? "Update Product" : "Create Product"}</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
