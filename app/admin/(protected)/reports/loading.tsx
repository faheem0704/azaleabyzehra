export default function AdminReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-ivory-200 rounded w-36" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-ivory-200 h-28 rounded-xl" />
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div className="h-5 bg-ivory-200 rounded w-40" />
        <div className="h-56 bg-ivory-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
          <div className="h-5 bg-ivory-200 rounded w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-ivory-200 rounded" />
              <div className="flex-1 h-4 bg-ivory-200 rounded" />
              <div className="h-4 bg-ivory-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
          <div className="h-5 bg-ivory-200 rounded w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-ivory-200 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
