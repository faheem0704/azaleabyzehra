export default function ProductDetailLoading() {
  return (
    <div className="pt-24 pb-24 section-padding">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-[3/4] bg-ivory-200 animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-ivory-200 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Details */}
        <div className="space-y-6 pt-4">
          <div className="h-5 w-24 bg-ivory-200 animate-pulse rounded" />
          <div className="h-10 w-3/4 bg-ivory-200 animate-pulse rounded" />
          <div className="h-8 w-32 bg-ivory-200 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-ivory-200 animate-pulse rounded" />
            <div className="h-4 bg-ivory-200 animate-pulse rounded w-5/6" />
            <div className="h-4 bg-ivory-200 animate-pulse rounded w-4/6" />
          </div>
          <div className="h-12 bg-ivory-200 animate-pulse rounded" />
          <div className="h-12 bg-rose-gold/20 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
