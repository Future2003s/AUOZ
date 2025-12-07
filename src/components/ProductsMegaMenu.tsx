"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/apiRequests/products";
import { envConfig } from "@/config";

interface ProductMenuItem {
  href: string;
  label: string;
  query?: string;
  categoryId?: string;
  categorySlug?: string;
}

interface ProductsMegaMenuProps {
  items: ProductMenuItem[];
  locale: string;
}

interface PreviewData {
  products: Array<{
    image: string;
    title: string;
    price: number;
    href: string;
    id: string;
  }>;
  categoryHref: string;
}

export default function ProductsMegaMenu({
  items,
  locale,
}: ProductsMegaMenuProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(1);
  const preloadedImages = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cache để lưu sản phẩm đã fetch, tránh fetch lại khi hover vào cùng item
  const productsCache = useRef<Map<string, PreviewData>>(new Map());
  const currentFetchKey = useRef<string | null>(null);

  // Fetch product data for preview - Gọi trực tiếp từ API backend
  const fetchProductPreview = async (item: ProductMenuItem) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Tạo cache key dựa trên categoryId hoặc href
    const cacheKey = item.categoryId || item.categorySlug || item.href || item.label;
    
    // Kiểm tra cache trước - nếu đã có thì dùng ngay, không cần fetch lại
    if (productsCache.current.has(cacheKey)) {
      const cachedData = productsCache.current.get(cacheKey)!;
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Sử dụng cache cho:", item.label);
      }
      setPreviewData(cachedData);
      setImageOpacity(1);
      setIsLoading(false);
      return;
    }

    // Tăng delay để tránh fetch quá nhanh khi di chuyển chuột
    timeoutRef.current = setTimeout(async () => {
      // Đánh dấu đang fetch item này
      currentFetchKey.current = cacheKey;
      
      // KHÔNG reset preview data ngay - giữ lại data cũ để tránh chớp
      setIsLoading(true);
      // Chỉ fade out một chút, không set opacity = 0
      setImageOpacity(0.7);

      try {
        let products: Product[] = [];
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Fetching product preview for:", item);
        }

        // Fetch sản phẩm cho preview - chỉ lấy đủ để hiển thị (tối đa 2 trang)
        let allProducts: Product[] = [];
        let totalPages = 1;
        let hasMore = true;
        let currentPage = 1;
        const MAX_PREVIEW_PAGES = 2; // Chỉ fetch 2 trang đầu để preview nhanh hơn

        // Fetch sản phẩm cho preview (giới hạn số trang để tải nhanh)
        while (hasMore && currentPage <= MAX_PREVIEW_PAGES) {
          const pageParams = new URLSearchParams();
          pageParams.set("page", String(currentPage));
          pageParams.set("size", "50"); // Giảm từ 100 xuống 50 để tải nhanh hơn
          pageParams.set("status", "active");
          pageParams.set("isVisible", "true");

          // Try to fetch products based on category ID, category slug, query
          if (item.categoryId) {
            if (process.env.NODE_ENV === "development") {
              console.log(`📦 Fetching trang ${currentPage} by category ID from API:`, item.categoryId);
            }
            pageParams.set("categoryId", item.categoryId);
          } else if (item.categorySlug || item.href.includes("category=")) {
            const categoryMatch = item.href.match(/[?&]category=([^&]+)/);
            const categorySlug = item.categorySlug || (categoryMatch ? decodeURIComponent(categoryMatch[1]) : null);
            if (categorySlug) {
              if (process.env.NODE_ENV === "development") {
                console.log(`📦 Fetching trang ${currentPage} by category slug from API:`, categorySlug);
              }
              pageParams.set("q", categorySlug);
            }
          } else if (item.query) {
            if (process.env.NODE_ENV === "development") {
              console.log(`📦 Fetching trang ${currentPage} by query from API:`, item.query);
            }
            pageParams.set("q", item.query);
          } else {
            // Nếu là "Tất cả sản phẩm", lấy tất cả
            if (process.env.NODE_ENV === "development") {
              console.log(`📦 Fetching trang ${currentPage} - Tất cả sản phẩm`);
            }
          }
          
          try {
            const response = await fetch(`/api/products/public?${pageParams.toString()}`, {
              next: { revalidate: 180 }, // Cache 3 phút cho mega menu preview
            });
            
            if (response.ok) {
              const data = await response.json();
              const list: Product[] = Array.isArray(data?.data) ? data.data : [];
              
              // Lấy thông tin pagination từ trang đầu tiên
              if (currentPage === 1 && data?.pagination) {
                totalPages = data.pagination.totalPages || data.pagination.pages || 1;
                const totalElements = data.pagination.totalElements || data.pagination.total || 0;
                if (process.env.NODE_ENV === "development") {
                  console.log(`📊 Tổng số sản phẩm: ${totalElements}, Tổng số trang: ${totalPages}`);
                }
              }

              // Thêm sản phẩm vào danh sách (tránh duplicate)
              const existingIds = new Set(allProducts.map((p) => p._id));
              const newProducts = list.filter((p) => !existingIds.has(p._id));
              allProducts = [...allProducts, ...newProducts];

              if (process.env.NODE_ENV === "development") {
                console.log(`✅ Trang ${currentPage}: ${newProducts.length} sản phẩm mới, Tổng: ${allProducts.length}`);
              }

              // Kiểm tra xem đã lấy hết chưa
              if (data?.pagination) {
                const totalElements = data.pagination.totalElements || data.pagination.total || 0;
                if (allProducts.length >= totalElements || currentPage >= totalPages || list.length === 0) {
                  hasMore = false;
                }
              } else {
                if (list.length === 0 || list.length < 50) {
                  hasMore = false;
                }
              }
            }
          } catch (err) {
            console.error(`❌ Error fetching trang ${currentPage}:`, err);
            hasMore = false;
          }

          currentPage++;
        }

        products = allProducts;
        if (process.env.NODE_ENV === "development") {
          console.log(`🎉 Đã lấy ${products.length} sản phẩm từ API cho preview`);
          console.log("📊 Products found:", products.length);
        }

        if (products.length > 0) {
          // Lấy 7 sản phẩm: 1 feature + 6 sản phẩm nhỏ
          // Safety check: chỉ lấy products có _id hợp lệ
          const validProducts = products.filter((p) => p?._id);
          const previewProducts = validProducts.slice(0, 7).map((product) => {
            const mainImage =
              product.images?.find((img) => img.isMain)?.url ||
              product.images?.[0]?.url ||
              "/images/logo.png";

            const imageUrl = mainImage.startsWith("http")
              ? mainImage
              : `${envConfig.NEXT_PUBLIC_BACKEND_URL}${mainImage}`;

            return {
              id: product._id!,
              image: imageUrl,
              title: product.name || "Product",
              price: product.price || 0,
              href: `/${locale}/products/${product._id}`,
            };
          });

          if (process.env.NODE_ENV === "development") {
            console.log(`✅ Sử dụng ${previewProducts.length} sản phẩm để preview`);
          }

          // Preload images
          const imagePromises = previewProducts.map((previewProduct) => {
            return new Promise<void>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                preloadedImages.current.add(previewProduct.image);
                resolve();
              };
              img.onerror = () => resolve(); // Continue even if image fails
              img.src = previewProduct.image;
            });
          });

          Promise.all(imagePromises).then(() => {
            // Chỉ update nếu vẫn đang fetch item này (tránh race condition)
            if (currentFetchKey.current === cacheKey) {
              const newPreviewData: PreviewData = {
                products: previewProducts,
                categoryHref: item.href,
              };
              
              // Lưu vào cache
              productsCache.current.set(cacheKey, newPreviewData);
              
              // Update preview với smooth transition
              setPreviewData(newPreviewData);
              setImageOpacity(1);
              setIsLoading(false);
            }
          });
        } else {
          // Final fallback: use placeholder nếu không tìm thấy sản phẩm nào
          if (process.env.NODE_ENV === "development") {
            console.log("📝 No products found, using placeholder for:", item.label);
          }
          const emptyPreviewData: PreviewData = {
            products: [],
            categoryHref: item.href,
          };
          
          // Lưu vào cache để tránh fetch lại
          productsCache.current.set(cacheKey, emptyPreviewData);
          
          // Chỉ update nếu vẫn đang fetch item này
          if (currentFetchKey.current === cacheKey) {
            setPreviewData(emptyPreviewData);
            setImageOpacity(1);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching product preview:", error);
        const errorPreviewData: PreviewData = {
          products: [],
          categoryHref: item.href,
        };
        
        // Lưu vào cache để tránh fetch lại khi lỗi
        productsCache.current.set(cacheKey, errorPreviewData);
        
        // Chỉ update nếu vẫn đang fetch item này
        if (currentFetchKey.current === cacheKey) {
          setPreviewData(errorPreviewData);
          setImageOpacity(1);
          setIsLoading(false);
        }
      }
    }, 200); // Tăng delay từ 100ms lên 200ms để tránh fetch quá nhanh
  };

  // Preload first item on mount
  useEffect(() => {
    if (items.length > 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("🚀 Initializing ProductsMegaMenu with items:", items);
      }
      fetchProductPreview(items[0]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleMouseEnter = (item: ProductMenuItem) => {
    fetchProductPreview(item);
  };

  // Lấy feature product (sản phẩm đầu tiên) và các sản phẩm nhỏ (6 sản phẩm còn lại)
  const featureProduct = previewData?.products[0] || null;
  const smallProducts = previewData?.products.slice(1, 7) || [];

  return (
    <div className="grid grid-cols-[240px_1fr] gap-6 p-6 min-w-[900px] max-w-[1100px] bg-gradient-to-br from-white via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-gray-700">
      {/* Left Column - Category Links */}
      <div className="space-y-1">
        <div className="mb-4 pb-3 border-b border-rose-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Danh mục
          </h3>
        </div>
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => handleMouseEnter(item)}
            className="group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-950/40 dark:hover:to-pink-950/40"
            style={{
              animationDelay: `${index * 30}ms`,
            }}
          >
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-rose-500 to-pink-500 rounded-r-full group-hover:h-full transition-all duration-300" />
            
            <span className="relative z-10 flex-1 transition-all duration-300 group-hover:translate-x-1">
              {item.label}
            </span>
            
            {/* Arrow icon */}
            <svg
              className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>

      {/* Right Column - Bento Grid */}
      <div className="relative">
        {isLoading && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-full">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-rose-600 border-t-transparent"></div>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Đang tải...</span>
          </div>
        )}

        {previewData && previewData.products.length > 0 ? (
          <div 
            className="relative"
            style={{ opacity: imageOpacity }}
          >
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[480px]">
              {/* Feature Product - Large (2x2) */}
              {featureProduct && (
                <Link
                  href={featureProduct.href}
                  className="group relative col-span-2 row-span-2 rounded-xl overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 dark:from-gray-800 dark:to-gray-700 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border border-rose-200/50 dark:border-gray-600 flex flex-col"
                >
                  {/* Image Container - Takes most of the space */}
                  <div className="relative flex-1 min-h-0">
                    <Image
                      src={featureProduct.image}
                      alt={featureProduct.title}
                      fill
                      sizes="(max-width: 768px) 400px, 400px"
                      className="object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    {/* Badge - Top Left */}
                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg">
                      <svg className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">Nổi bật</span>
                    </div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  {/* Content - Below Image */}
                  <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-3 mt-auto">
                    <h3 className="text-base font-bold mb-1 line-clamp-1 text-slate-900 dark:text-white">
                      {featureProduct.title}
                    </h3>

                    {featureProduct.price > 0 && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(featureProduct.price)}
                        </p>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Xem chi tiết</span>
                      <svg
                        className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}

              {/* Small Products Grid - Up to 6 products in 2 columns, 3 rows */}
              {smallProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={product.href}
                  className="group relative col-span-1 row-span-1 rounded-xl overflow-hidden bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-500 hover:scale-[1.05] border border-rose-200 dark:border-gray-600 shadow-sm"
                  style={{
                    animationDelay: `${(index + 1) * 50}ms`,
                  }}
                >
                  {/* Image */}
                  <div className="relative h-full flex flex-col">
                    <div className="relative flex-1 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 150px, 150px"
                        className="object-cover transition-all duration-500 group-hover:scale-110"
                      />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Quick view badge */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="px-2.5 py-1 bg-white/95 dark:bg-gray-900/95 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                          Xem
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-1.5 bg-white dark:bg-gray-800">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300 leading-tight">
                        {product.title}
                      </h4>
                      {product.price > 0 ? (
                        <p className="text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent dark:from-rose-400 dark:to-pink-400">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(product.price)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </Link>
              ))}
            </div>

            {/* View All Button */}
            {previewData.products.length >= 7 && (
              <Link
                href={previewData.categoryHref}
                className="mt-4 group relative flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden"
              >
                <span className="relative z-10">Xem tất cả sản phẩm</span>
                <svg
                  className="w-4 h-4 relative z-10 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            )}
          </div>
        ) : previewData && previewData.products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-rose-400 dark:text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Chưa có sản phẩm
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Danh mục này hiện chưa có sản phẩm. Vui lòng quay lại sau!
            </p>
            <Link
              href={previewData.categoryHref}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl"
            >
              Xem danh mục
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center min-h-[480px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 dark:border-rose-900 border-t-rose-600 dark:border-t-rose-400"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-rose-400/30"></div>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-gray-400 font-medium">
              Đang tải sản phẩm...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
