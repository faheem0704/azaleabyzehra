export default function AdminCategoriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-ivory-200 rounded w-40" />
        <div className="h-9 bg-ivory-200 rounded w-36" />
      </div>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-ivory-200">
            <div className="h-4 bg-ivory-200 rounded flex-1" />
            <div className="h-4 bg-ivory-200 rounded w-24" />
            <div className="h-8 bg-ivory-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
