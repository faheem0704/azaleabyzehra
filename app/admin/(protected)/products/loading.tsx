export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-ivory-200 rounded w-40" />
        <div className="h-9 bg-ivory-200 rounded w-32" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 bg-ivory-200 rounded flex-1" />
        <div className="h-9 bg-ivory-200 rounded w-28" />
      </div>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-ivory-200">
            <div className="w-12 h-12 bg-ivory-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-ivory-200 rounded w-48" />
              <div className="h-3 bg-ivory-200 rounded w-32" />
            </div>
            <div className="h-4 bg-ivory-200 rounded w-20" />
            <div className="h-4 bg-ivory-200 rounded w-16" />
            <div className="h-8 bg-ivory-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
