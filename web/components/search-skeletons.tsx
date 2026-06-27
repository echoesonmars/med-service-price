"use client";

interface SearchSkeletonsProps {
  query: string;
}

export function SearchSkeletons({ query }: SearchSkeletonsProps) {
  return (
    <div className="space-y-6">
      {/* Premium Spinner and Text */}
      <div className="flex items-center gap-3">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <span className="text-xs font-heading font-semibold text-muted-foreground animate-pulse">
          Ищем лучшие предложения по запросу &quot;{query}&quot;...
        </span>
      </div>

      {/* Shimmering Skeletons */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-[18px] blogs-card space-y-3 relative overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" />

            <div className="flex justify-between items-start">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 animate-pulse" />
              <div className="h-5 bg-accent/20 rounded w-16 animate-pulse" />
            </div>
            <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-20 animate-pulse" />
              <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded w-28 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
