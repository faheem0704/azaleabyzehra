export default function OrdersLoading() {
  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-40 bg-ivory-200 animate-pulse rounded mb-10" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-ivory-200 overflow-hidden">
              <div className="bg-ivory-200/50 px-6 py-4 flex gap-8">
                <div className="h-10 w-24 bg-ivory-200 animate-pulse rounded" />
                <div className="h-10 w-24 bg-ivory-200 animate-pulse rounded" />
                <div className="h-10 w-24 bg-ivory-200 animate-pulse rounded" />
              </div>
              <div className="px-6 py-4 space-y-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-14 h-18 bg-ivory-200 animate-pulse flex-shrink-0" style={{ height: 72 }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-ivory-200 animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-ivory-200 animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
