export default function AdminCustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-ivory-200 rounded w-40" />
      <div className="h-9 bg-ivory-200 rounded w-full" />
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-ivory-200">
            <div className="w-9 h-9 bg-ivory-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-ivory-200 rounded w-36" />
              <div className="h-3 bg-ivory-200 rounded w-48" />
            </div>
            <div className="h-4 bg-ivory-200 rounded w-24" />
            <div className="h-4 bg-ivory-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
