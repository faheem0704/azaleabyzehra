export default function ProductsLoading() {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="h-8 w-48 bg-ivory-200 animate-pulse rounded mb-2" />
      <div className="h-4 w-32 bg-ivory-200 animate-pulse rounded mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-ivory-200 animate-pulse" />
            <div className="h-4 bg-ivory-200 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-ivory-200 animate-pulse rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
