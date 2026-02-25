"use client";
import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { Product } from "@/apiRequests/products";
import { metaApi } from "@/apiRequests/meta";
import { useI18n } from "@/i18n/I18nProvider";
import { Search, SlidersHorizontal, Grid3X3, List, X, ChevronDown, Check } from "lucide-react";
import { SearchOverlay } from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";
import type { Category, Brand } from "@/types/meta";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  "price-asc": "Giá thấp → cao",
  "price-desc": "Giá cao → thấp",
  "name-asc": "Tên A–Z",
  "name-desc": "Tên Z–A",
};

export default function ShopPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setQ(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load categories & brands
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([metaApi.categories(), metaApi.brands()]);
        const norm = (r: unknown): any[] => {
          if (!r) return [];
          if (Array.isArray(r)) return r;
          const o = r as Record<string, any>;
          return Array.isArray(o?.data) ? o.data : Array.isArray(o?.items) ? o.items : [];
        };
        setCategories(norm(catRes) as Category[]);
        setBrands(norm(brandRes) as Brand[]);
      } catch { setCategories([]); setBrands([]); }
    };
    load();
  }, []);

  // Load products
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const ps = new URLSearchParams();
        if (q) ps.set("q", q);
        if (selectedCategory !== "all") ps.set("categoryId", selectedCategory);
        if (selectedBrand !== "all") ps.set("brandId", selectedBrand);
        ps.set("page", "1");
        ps.set("size", "100");
        const res = await fetch(`/api/products/public?${ps}`);
        if (cancelled) return;
        const data = await res.json();
        const list: Product[] = Array.isArray(data?.data) ? data.data.filter((p: Product) => p?._id) : [];
        setItems(list);
      } catch { if (!cancelled) setItems([]); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [q, selectedCategory, selectedBrand]);

  const sorted = useMemo(() => {
    const s = [...items];
    if (sortBy === "name-asc") s.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") s.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "price-asc") s.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") s.sort((a, b) => Number(b.price) - Number(a.price));
    return s;
  }, [items, sortBy]);

  const clearAll = () => {
    setSearchQuery(""); setSelectedCategory("all"); setSelectedBrand("all"); setSortBy("newest");
  };

  const activeFilterCount = [
    selectedCategory !== "all",
    selectedBrand !== "all",
    sortBy !== "newest",
  ].filter(Boolean).length;

  // Category label helpers
  const catLabel = (cat: Category) => cat.name ?? cat.categoryName ?? cat.title ?? cat.label ?? "";
  const catId = (cat: Category) => (cat.id ?? cat._id ?? cat.value)?.toString() ?? "";
  const brandLabel = (b: Brand) => b.name ?? b.title ?? b.label ?? "";
  const brandId = (b: Brand) => (b.id ?? b._id ?? b.value)?.toString() ?? "";

  return (
    <div className="min-h-screen bg-[#f8f9fa] mt-25">

      {/* ─────────────────────────────────────────────
          TOP SEARCH BAR  (Google-style)
      ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-[var(--header-height,64px)] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">

          {/* Search input */}
          <button
            onClick={() => setShowSearchOverlay(true)}
            className="flex-1 flex items-center gap-2.5 h-11 px-4 bg-gray-100 hover:bg-gray-200/80 rounded-full text-sm text-gray-500 transition-colors text-left"
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate">{searchQuery || "Tìm kiếm sản phẩm…"}</span>
            {searchQuery && (
              <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                {sorted.length}
              </span>
            )}
          </button>

          {/* Filter button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`relative flex items-center gap-1.5 h-11 px-4 rounded-full border text-sm font-medium transition-all ${activeFilterCount > 0
              ? "bg-rose-50 border-rose-300 text-rose-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative hidden sm:block">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 h-11 px-4 rounded-full border border-gray-200 bg-white text-sm text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden w-48 z-50 py-1">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setSortBy(val); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${sortBy === val ? "text-rose-600 bg-rose-50 font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {label}
                    {sortBy === val && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              title="Dạng lưới"
              className={`p-2 rounded-full transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-rose-500" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Dạng danh sách"
              className={`p-2 rounded-full transition-all ${viewMode === "list" ? "bg-white shadow-sm text-rose-500" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Filter panel (expandable) ── */}
        {filterOpen && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
              {/* Categories */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Danh mục</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${selectedCategory === "all"
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                      }`}
                  >
                    Tất cả
                  </button>
                  {categories.filter(c => catId(c)).map(cat => (
                    <button
                      key={catId(cat)}
                      onClick={() => setSelectedCategory(catId(cat))}
                      className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${selectedCategory === catId(cat)
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                        }`}
                    >
                      {catLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {brands.filter(b => brandId(b)).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thương hiệu</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBrand("all")}
                      className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${selectedBrand === "all"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                        }`}
                    >
                      Tất cả
                    </button>
                    {brands.filter(b => brandId(b)).map(brand => (
                      <button
                        key={brandId(brand)}
                        onClick={() => setSelectedBrand(brandId(brand))}
                        className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${selectedBrand === brandId(brand)
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                          }`}
                      >
                        {brandLabel(brand)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort (mobile) */}
              <div className="sm:hidden">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sắp xếp</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSortBy(val)}
                      className={`h-8 px-4 rounded-full text-sm font-medium border transition-all ${sortBy === val
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium">
                  <X className="w-3.5 h-3.5" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          CONTENT AREA
      ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Active filter chips row */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-gray-500 font-medium">Bộ lọc:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-rose-50 border border-rose-200 rounded-full text-xs text-rose-700 font-medium">
                {catLabel(categories.find(c => catId(c) === selectedCategory)!)}
                <button onClick={() => setSelectedCategory("all")} className="hover:text-rose-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrand !== "all" && (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
                {brandLabel(brands.find(b => brandId(b) === selectedBrand)!)}
                <button onClick={() => setSelectedBrand("all")} className="hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy !== "newest" && (
              <span className="inline-flex items-center gap-1.5 h-7 px-3 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 font-medium">
                {SORT_LABELS[sortBy]}
                <button onClick={() => setSortBy("newest")} className="hover:text-gray-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-rose-600 underline transition-colors">
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {loading ? "Đang tải…" : (
              <><span className="font-semibold text-gray-800">{sorted.length}</span> sản phẩm{searchQuery && <> cho &ldquo;<span className="text-rose-600">{searchQuery}</span>&rdquo;</>}</>
            )}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-5 bg-gray-100 rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
            {sorted.map(product => (
              <Suspense
                key={product._id}
                fallback={
                  <div className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-sm">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
                      <div className="h-5 bg-gray-100 rounded-full w-2/5" />
                    </div>
                  </div>
                }
              >
                <ProductCard product={product} locale={locale} viewMode={viewMode} />
              </Suspense>
            ))}
          </div>
        ) : (
          /* Empty state — Google-style */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="h-9 px-5 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        onSearch={(query) => { setSearchQuery(query); setShowSearchOverlay(false); }}
      />
    </div>
  );
}
