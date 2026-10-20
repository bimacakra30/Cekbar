"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-md w-3/4 animate-skeleton" />
                <div className="h-3 bg-muted rounded-md w-full animate-skeleton" />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="h-3 bg-muted rounded-full w-14 animate-skeleton" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-5 flex flex-col items-center"
          >
            <div className="w-11 h-11 rounded-xl bg-muted animate-skeleton mb-3" />
            <div className="h-7 bg-muted rounded-md w-12 animate-skeleton mb-2" />
            <div className="h-3 bg-muted rounded-md w-24 animate-skeleton" />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 bg-muted rounded-md w-40 animate-skeleton" />
        </div>
        <div className="px-5 py-3 border-b border-border">
          <div className="flex gap-8">
            <div className="h-3 bg-muted rounded-md w-20 animate-skeleton" />
            <div className="h-3 bg-muted rounded-md w-16 animate-skeleton" />
            <div className="h-3 bg-muted rounded-md w-24 animate-skeleton" />
            <div className="h-3 bg-muted rounded-md w-14 animate-skeleton" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-border last:border-0">
            <div className="flex gap-8">
              <div className="h-4 bg-muted rounded-md w-36 animate-skeleton" />
              <div className="h-4 bg-muted rounded-md w-28 animate-skeleton" />
              <div className="h-4 bg-muted rounded-md w-32 animate-skeleton" />
              <div className="h-4 bg-muted rounded-full w-16 animate-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
