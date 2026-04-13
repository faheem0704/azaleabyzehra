export default function NewArrivalsLoading() {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="text-center mb-12">
        <div className="h-10 w-56 bg-ivory-200 animate-pulse rounded mx-auto mb-4" />
        <div className="h-4 w-80 bg-ivory-200 animate-pulse rounded mx-auto" />
      </div>
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
