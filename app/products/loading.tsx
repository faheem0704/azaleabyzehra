const ProductSkeleton = () => (
  <div className="space-y-3">
    <div className="aspect-[3/4] bg-ivory-200 animate-pulse" />
    <div className="h-3 bg-ivory-200 animate-pulse rounded w-3/4" />
    <div className="h-3 bg-ivory-200 animate-pulse rounded w-1/2" />
  </div>
);

export default function ProductsLoading() {
  return (
    <div className="pt-24 lg:pt-32 pb-24">
      {/* Header */}
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 mb-10">
        <div className="h-3 w-28 bg-ivory-200 animate-pulse rounded mb-3" />
        <div className="h-10 w-64 bg-ivory-200 animate-pulse rounded mb-3" />
        <div className="h-3 w-24 bg-ivory-200 animate-pulse rounded" />
      </div>

      {/* Desktop: sidebar + 3-col grid */}
      <div className="hidden lg:flex px-4 md:px-8 lg:px-16 xl:px-24 gap-10">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 border-b border-ivory-200 pb-5">
              <div className="h-3 w-20 bg-ivory-200 animate-pulse rounded" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-3 bg-ivory-200 animate-pulse rounded w-3/4" />
              ))}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex-1 grid grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      </div>

      {/* Mobile: 2-col grid */}
      <div className="lg:hidden px-3 md:px-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    </div>
  );
}
