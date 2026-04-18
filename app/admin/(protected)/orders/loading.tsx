export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-ivory-200 rounded w-36" />
        <div className="h-9 bg-ivory-200 rounded w-28" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 bg-ivory-200 rounded flex-1" />
        <div className="h-9 bg-ivory-200 rounded w-36" />
      </div>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="flex gap-4 px-6 py-3 border-b border-ivory-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-ivory-200 rounded w-24" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-ivory-200">
            <div className="h-4 bg-ivory-200 rounded w-28" />
            <div className="h-4 bg-ivory-200 rounded flex-1" />
            <div className="h-6 bg-ivory-200 rounded-full w-20" />
            <div className="h-4 bg-ivory-200 rounded w-20" />
            <div className="h-8 bg-ivory-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
