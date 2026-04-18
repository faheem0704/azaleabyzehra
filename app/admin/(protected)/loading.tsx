export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-ivory-200 rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-ivory-200 h-28 rounded-xl" />
        ))}
      </div>
      <div className="bg-ivory-200 h-72 rounded-xl" />
      <div className="bg-ivory-200 h-48 rounded-xl" />
    </div>
  );
}
