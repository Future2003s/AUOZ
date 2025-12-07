"use client";
import React, { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { productApiRequest, Product } from "@/apiRequests/products";
import { metaApi } from "@/apiRequests/meta";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useI18n } from "@/i18n/I18nProvider";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchOverlay } from "@/components/SearchOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ProductCard from "@/components/ProductCard";
import type { Category, Brand } from "@/types/meta";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

type ViewMode = "grid" | "list";
type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "newest";

export default function ShopPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Debounced search
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load meta data
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          metaApi.categories(),
          metaApi.brands(),
        ]);

        const normalizeArray = (res: unknown): Category[] | Brand[] => {
          try {
            if (!res) return [];
            if (Array.isArray(res)) return res;
            
            // Type guard for object with data property
            const resObj = res as Record<string, any>;
            
            if (Array.isArray(resObj?.data)) return resObj.data;
            if (Array.isArray(resObj?.items)) return resObj.items;
            if (Array.isArray(resObj?.data?.items)) return resObj.data.items;
            if (Array.isArray(resObj?.result)) return resObj.result;
            if (resObj?.data && typeof resObj.data === "object") {
              const arrayKey = Object.keys(resObj.data).find((k) =>
                Array.isArray(resObj.data[k])
              );
              if (arrayKey) return resObj.data[arrayKey];
            }
          } catch {}

          return [];
        };

        setCategories(normalizeArray(categoriesRes) as Category[]);
        setBrands(normalizeArray(brandsRes) as Brand[]);
      } catch (error) {
        console.error("Failed to load meta data:", error);
        setCategories([]);
        setBrands([]);
      }
    };
    loadMeta();
  }, []);

  // Load products - Fetch ALL products from all pages
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          status: "active", // Add default status filter
          isVisible: "true", // Add default visibility filter
        };
        if (q) params.search = q;
        if (selectedCategory && selectedCategory !== "all")
          params.category = selectedCategory;
        if (selectedBrand && selectedBrand !== "all")
          params.brand = selectedBrand;

        const PAGE_LIMIT = 100; // Tăng limit để lấy nhiều sản phẩm hơn mỗi trang
        let allProducts: Product[] = [];
        let currentPage = 1;
        let totalPages = 1;
        let totalElements = 0;
        let hasMore = true;

        console.log("🔄 Bắt đầu fetch tất cả sản phẩm...");

        // Fetch tất cả các trang cho đến khi lấy hết sản phẩm
        while (hasMore && !cancelled) {
          const paramsPublic = new URLSearchParams();
          if (params.search) paramsPublic.set("q", params.search);
          if (params.category) paramsPublic.set("categoryId", params.category);
          if (params.brand) paramsPublic.set("brandId", params.brand);
          paramsPublic.set("page", String(currentPage));
          paramsPublic.set("size", String(PAGE_LIMIT));

          if (process.env.NODE_ENV === "development") {
            console.log(`📄 Đang fetch trang ${currentPage}...`);
          }

          const res = await fetch(
            `/api/products/public?${paramsPublic.toString()}`,
            {
              next: { revalidate: 120 }, // Cache 2 phút cho products list
            }
          );

          if (cancelled) return;

          if (!res.ok) {
            throw new Error(`Public products API failed: ${res.status}`);
          }

          const data = await res.json();
          const list: Product[] = Array.isArray(data?.data) ? data.data : [];

          // Lấy thông tin pagination từ trang đầu tiên
          if (currentPage === 1 && data?.pagination) {
            totalPages = data.pagination.totalPages || data.pagination.pages || 1;
            totalElements = data.pagination.totalElements || data.pagination.total || 0;
            if (process.env.NODE_ENV === "development") {
              console.log(`📊 Tổng số sản phẩm: ${totalElements}, Tổng số trang: ${totalPages}`);
            }
          }

          // Thêm sản phẩm vào danh sách (tránh duplicate bằng ID)
          // Safety check: chỉ lấy products có _id hợp lệ
          const validProducts = list.filter((p) => p?._id);
          const existingIds = new Set(allProducts.map((p) => p._id).filter(Boolean));
          const newProducts = validProducts.filter((p) => p._id && !existingIds.has(p._id));
          allProducts = [...allProducts, ...newProducts];

          if (process.env.NODE_ENV === "development") {
            console.log(`✅ Trang ${currentPage}: ${newProducts.length} sản phẩm mới, Tổng: ${allProducts.length}`);
          }

          // Kiểm tra xem đã lấy hết chưa
          if (data?.pagination) {
            // Nếu đã lấy đủ số lượng hoặc đã đến trang cuối
            if (
              allProducts.length >= totalElements ||
              currentPage >= totalPages ||
              list.length === 0
            ) {
              hasMore = false;
              if (process.env.NODE_ENV === "development") {
                console.log(`✅ Đã lấy hết tất cả sản phẩm: ${allProducts.length}/${totalElements}`);
              }
            }
          } else {
            // Không có pagination info - dừng nếu không còn sản phẩm nào
            if (list.length === 0 || list.length < PAGE_LIMIT) {
              hasMore = false;
            }
          }

          currentPage++;

          // Safety check: giới hạn tối đa 50 trang để tránh vòng lặp vô hạn
          if (currentPage > 50) {
            if (process.env.NODE_ENV === "development") {
              console.warn("⚠️ Đã đạt giới hạn 50 trang, dừng fetch");
            }
            hasMore = false;
          }
        }

        if (cancelled) return;

        if (process.env.NODE_ENV === "development") {
          console.log(`🎉 Hoàn thành! Tổng cộng ${allProducts.length} sản phẩm`);
        }
        setItems(allProducts);
      } catch (error) {
        if (cancelled) return;
        console.error("❌ Failed to load products:", error);
        setItems([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [q, selectedCategory, selectedBrand]);

  // Sort products
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "price-asc":
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case "price-desc":
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case "newest":
      default:
        return sorted;
    }
  }, [items, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery ||
    (selectedCategory && selectedCategory !== "all") ||
    (selectedBrand && selectedBrand !== "all") ||
    sortBy !== "newest";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 mt-25">
      {/* Hero Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Khám Phá Sản Phẩm
            </h1>
            <p className="text-muted-foreground text-lg">
              Tìm kiếm và khám phá những sản phẩm tuyệt vời nhất
            </p>
          </div>

          {/* Search Bar - Click to open overlay */}
          <div className="max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setShowSearchOverlay(true)}
              className="w-full h-12 text-base shadow-lg border-2 hover:border-blue-500 hover:bg-white justify-start text-left font-normal"
            >
              <Search className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {searchQuery || "Tìm kiếm sản phẩm..."}
              </span>
              {searchQuery && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {sortedItems.length} kết quả
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            <Card className="shadow-md border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Bộ lọc
                  </h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Xóa bộ lọc
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Danh mục
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {categories.map((cat) => {
                          const id = (
                            cat.id ??
                            cat._id ??
                            cat.value
                          )?.toString();
                          const label =
                            cat.name ??
                            cat.categoryName ??
                            cat.title ??
                            cat.label ??
                            id;
                          if (!id) return null;
                          return (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Thương hiệu
                    </label>
                    <Select
                      value={selectedBrand}
                      onValueChange={setSelectedBrand}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thương hiệu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                        {brands.map((brand) => {
                          const id = (
                            brand.id ??
                            brand._id ??
                            brand.value
                          )?.toString();
                          const label =
                            brand.name ?? brand.title ?? brand.label ?? id;
                          if (!id) return null;
                          return (
                            <SelectItem key={id} value={id}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Sắp xếp
                    </label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: SortOption) => setSortBy(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Mới nhất</SelectItem>
                        <SelectItem value="name-asc">Tên A-Z</SelectItem>
                        <SelectItem value="name-desc">Tên Z-A</SelectItem>
                        <SelectItem value="price-asc">
                          Giá thấp đến cao
                        </SelectItem>
                        <SelectItem value="price-desc">
                          Giá cao đến thấp
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Hiển thị {sortedItems.length} sản phẩm</span>
                {hasActiveFilters && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="secondary" className="text-xs">
                      Đã lọc
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 h-4 w-4"></div>
                  <span>Đang tải sản phẩm...</span>
                </div>
              </div>
            ) : sortedItems.length > 0 ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {sortedItems.map((product) => (
                  <Suspense
                    key={product._id}
                    fallback={
                      <Card className="animate-pulse">
                        <div className="aspect-square bg-gray-200" />
                        <CardContent className="p-4">
                          <div className="h-4 bg-gray-200 rounded mb-2" />
                          <div className="h-6 bg-gray-200 rounded" />
                        </CardContent>
                      </Card>
                    }
                  >
                    <ProductCard
                      product={product}
                      locale={locale}
                      viewMode={viewMode}
                    />
                  </Suspense>
                ))}
              </div>
            ) : (
              <Card className="text-center p-12">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    Không tìm thấy sản phẩm
                  </h3>
                  <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Xóa bộ lọc
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        onSearch={(query) => {
          setSearchQuery(query);
          setShowSearchOverlay(false);
        }}
      />
    </div>
  );
}
