export default function AccountLoading() {
  return (
    <div className="pt-32 pb-24 px-4 md:px-8 lg:px-16 xl:px-24">
      <div className="max-w-3xl mx-auto">
        <div className="h-10 w-48 bg-ivory-200 animate-pulse rounded mb-3" />
        <div className="h-3 w-36 bg-ivory-200 animate-pulse rounded mb-10" />
        <div className="flex gap-4 mb-12">
          <div className="h-10 w-28 bg-ivory-200 animate-pulse rounded" />
          <div className="h-10 w-24 bg-ivory-200 animate-pulse rounded" />
        </div>
        <div className="h-8 w-44 bg-ivory-200 animate-pulse rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-ivory-200 p-5">
              <div className="h-4 w-32 bg-ivory-200 animate-pulse rounded mb-2" />
              <div className="h-3 w-48 bg-ivory-200 animate-pulse rounded mb-1" />
              <div className="h-3 w-40 bg-ivory-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
