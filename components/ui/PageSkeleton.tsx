import { Skeleton } from "@/components/ui/skeleton";

/** Ladegerüst für eine ganze Seite (Header + Kartenraster), z.B. solange der gespeicherte Zustand geladen wird. */
export function PageSkeleton() {
  return (
    <div className="min-h-dvh space-y-6 px-4 pt-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}
