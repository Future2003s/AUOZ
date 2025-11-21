"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, X, Loader2, Flame, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@/apiRequests/products";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/i18n/I18nProvider";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

export function SearchOverlay({ isOpen, onClose, onSearch }: SearchOverlayProps) {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [popularSearches] = useState<string[]>([
    "Trà vải",
    "Quà tặng",
    "Khuyến mãi",
    "Sản phẩm nổi bật",
  ]);
  
  // Color variants for hashtags
  const hashtagColors = [
    "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
    "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200",
    "bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200",
    "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
  ];
  
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // Handle visibility - backdrop appears immediately, card animates with slight delay
  useEffect(() => {
    if (isOpen) {
      // Backdrop appears immediately, card animates in with slight delay
      setIsVisible(false);
      // Small delay before card appears for smoother experience
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, 100); // 100ms delay for card
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Use ref to avoid dependency loop
  const recentSearchesRef = useRef<string[]>([]);
  
  // Sync ref with state
  useEffect(() => {
    recentSearchesRef.current = recentSearches;
  }, [recentSearches]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("q", query);
        params.set("page", "1");
        params.set("size", "8");

        const res = await fetch(`/api/products/public?${params.toString()}`);
        if (cancelled) return;
        
        const data = await res.json();
        const products: Product[] = Array.isArray(data?.data) ? data.data : [];
        
        if (cancelled) return;
        setResults(products);

        // Save to recent searches (using ref to avoid dependency)
        if (products.length > 0) {
          const currentRecent = recentSearchesRef.current;
          const updated = [
            query,
            ...currentRecent.filter((s) => s !== query),
          ].slice(0, 5);
          setRecentSearches(updated);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Search error:", error);
        setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    if (onSearch) {
      onSearch(searchQuery);
    }
    onClose();
  }, [onSearch, onClose]);

  const formatCurrency = useCallback((amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount), []);

  // Memoize results to avoid unnecessary re-renders
  const memoizedResults = useMemo(() => results, [results]);

  // Always render when open to ensure backdrop appears immediately
  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 overflow-hidden"
      )}
      style={{ 
        pointerEvents: isOpen ? "auto" : "none"
      }}
    >
      {/* Backdrop - Appears immediately when open, no delay */}
      <div 
        className="absolute inset-0 bg-black/60"
        style={{ 
          backdropFilter: isOpen ? "blur(4px)" : "blur(0px)",
          WebkitBackdropFilter: isOpen ? "blur(4px)" : "blur(0px)",
          opacity: isOpen ? 1 : 0,
          transition: isOpen ? "none" : "opacity 200ms ease-out, backdrop-filter 200ms ease-out"
        }}
        onClick={onClose}
      />

      {/* Overlay Content - Centered Card Style */}
      <div className="relative h-full flex items-start justify-center pt-20 px-4 pointer-events-none">
        <div 
          className={cn(
            "w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
          )}
          style={{ 
            transform: isVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(0.5rem)",
            opacity: isVisible ? 1 : 0,
            transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: isVisible ? "auto" : "transform, opacity"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Search Input */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm, danh mục, bài viết..."
                  className="pl-12 pr-20 h-12 text-base border-2 focus:border-blue-500 rounded-lg"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
              >
                <X className="h-4 w-4 mr-1" />
                ESC
              </Button>
            </div>
          </div>

          {/* Content */}
          <div 
            className="max-h-[60vh] overflow-y-auto"
            style={{ 
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Đang tìm kiếm...</span>
              </div>
            )}

            {!loading && query && results.length > 0 && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Kết quả tìm kiếm ({results.length})
                  </h3>
                  <Button
                    variant="link"
                    onClick={() => handleSearch(query)}
                    className="text-blue-600 text-sm"
                  >
                    Xem tất cả
                  </Button>
                </div>
                <div className="grid gap-3">
                  {memoizedResults.map((product) => (
                    <Link
                      key={product._id}
                      href={`/${locale}/products/${product._id}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors group"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={
                            product.images?.[0]?.url ||
                            "https://placehold.co/200x200"
                          }
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        {product.brandName && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {product.brandName}
                          </p>
                        )}
                        <p className="text-base font-bold text-blue-600 mt-1">
                          {formatCurrency(Number(product.price))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="text-center py-12 px-6">
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-500 text-sm">
                  Thử tìm kiếm với từ khóa khác
                </p>
              </div>
            )}

            {!loading && !query && (
              <div className="p-6 space-y-8">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Tìm kiếm gần đây
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(search)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Trends */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Xu hướng phổ biến
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium border transition-transform duration-200 hover:scale-105",
                          hashtagColors[index % hashtagColors.length]
                        )}
                        style={{ willChange: "transform" }}
                      >
                        #{search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
