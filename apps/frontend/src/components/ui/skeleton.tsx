interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-white/5 border border-white/10 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1 h-3 w-1/2" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-20 !rounded-full" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
