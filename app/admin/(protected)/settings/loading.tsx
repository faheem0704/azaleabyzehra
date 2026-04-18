export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 bg-ivory-200 rounded w-36" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-5 bg-ivory-200 rounded w-40" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 bg-ivory-200 rounded w-24" />
                <div className="h-9 bg-ivory-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
