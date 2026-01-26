"use client";

export default function CalendarSkeleton() {
  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Header Skeleton */}
      <div className="hidden lg:grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-4 text-center">
            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
          </div>
        ))}
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-px">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 min-h-[120px] lg:min-h-[180px] p-3 lg:p-2 space-y-2"
          >
            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
