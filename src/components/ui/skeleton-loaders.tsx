"use client";

import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

// Image Skeleton with shimmer effect
export function ImageSkeleton({
  className,
  aspectRatio = "aspect-square",
}: {
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%] animate-shimmer",
        aspectRatio,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-slide" />
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100", className)}>
      <ImageSkeleton aspectRatio="aspect-[4/5]" />
      <div className="p-6 space-y-3">
        <div className="flex justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );
}

// Hero Slide Skeleton
export function HeroSlideSkeleton() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slide" />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex flex-col justify-center items-center text-center md:items-start md:text-left">
        <div className="max-w-2xl space-y-6 w-full">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
          <Skeleton className="h-12 w-48 rounded-full" />
          <Skeleton className="h-16 md:h-24 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-16 w-24 rounded-lg" />
            <Skeleton className="h-16 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Text Skeleton
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg p-6 space-y-4", className)}>
      <Skeleton className="h-6 w-2/3" />
      <TextSkeleton lines={3} />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
  );
}

