"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/apiRequests/products";
import { productApiRequest } from "@/apiRequests/products";
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
  image: string;
  title: string;
  price: number;
  href: string;
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

  // Fetch product data for preview
  const fetchProductPreview = async (item: ProductMenuItem) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Small delay to prevent too many API calls
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setImageOpacity(0);

      try {
        let products: Product[] = [];
        console.log("🔍 Fetching product preview for:", item);

        // Try to fetch products based on category ID, category slug, query, or fallback to featured
        if (item.categoryId) {
          // Fetch products by category ID (most reliable)
          console.log("📦 Fetching by category ID:", item.categoryId);
          try {
            const response = await productApiRequest.getProductsByCategory(item.categoryId, {
              limit: 1,
              status: "active",
            });
            console.log("✅ Products by category ID:", response);
            products = response.data || [];
          } catch (err) {
            console.error("❌ Error fetching by category ID:", err);
            // Fallback to search
            if (item.query || item.categorySlug) {
              const searchTerm = item.query || item.categorySlug || "";
              const response = await productApiRequest.searchProducts(searchTerm, {
                limit: 1,
                status: "active",
              });
              products = response.data || [];
            }
          }
        } else if (item.categorySlug || item.href.includes("category=")) {
          // Check if href contains category parameter
          const categoryMatch = item.href.match(/[?&]category=([^&]+)/);
          const categorySlug = item.categorySlug || (categoryMatch ? decodeURIComponent(categoryMatch[1]) : null);
          
          if (categorySlug) {
            console.log("📦 Fetching by category slug:", categorySlug);
            // Use search with category slug/name as fallback
            const response = await productApiRequest.searchProducts(categorySlug, {
              limit: 1,
              status: "active",
            });
            console.log("✅ Products by category slug:", response);
            products = response.data || [];
          }
        } else if (item.query) {
          console.log("📦 Fetching by query:", item.query);
          const response = await productApiRequest.searchProducts(item.query, {
            limit: 1,
            status: "active",
          });
          console.log("✅ Products by query:", response);
          products = response.data || [];
        } else {
          // Try to get featured products as fallback
          console.log("📦 Fetching featured products");
          const response = await productApiRequest.getFeaturedProducts();
          console.log("✅ Featured products:", response);
          products = response.data || [];
        }

        console.log("📊 Products found:", products.length);

        if (products.length > 0) {
          const product = products[0];
          console.log("✅ Using product:", product.name, product._id);
          
          const mainImage =
            product.images?.find((img) => img.isMain)?.url ||
            product.images?.[0]?.url ||
            "/images/logo.png";

          // Preload image
          const img = new window.Image();
          const imageUrl = mainImage.startsWith("http")
            ? mainImage
            : `${envConfig.NEXT_PUBLIC_BACKEND_URL}${mainImage}`;
          
          console.log("🖼️ Image URL:", imageUrl);
          img.src = imageUrl;

          img.onload = () => {
            console.log("✅ Image loaded successfully");
            preloadedImages.current.add(mainImage);
            setPreviewData({
              image: imageUrl,
              title: product.name,
              price: product.price,
              href: item.href,
            });
            setImageOpacity(1);
            setIsLoading(false);
          };

          img.onerror = () => {
            console.warn("⚠️ Image failed to load, using placeholder");
            setPreviewData({
              image: "/images/logo.png",
              title: product.name,
              price: product.price,
              href: item.href,
            });
            setImageOpacity(1);
            setIsLoading(false);
          };
        } else {
          // No products found, try to get any featured product as last resort
          console.warn("⚠️ No products found, trying featured products");
          try {
            const featuredResponse = await productApiRequest.getFeaturedProducts();
            if (featuredResponse.data && featuredResponse.data.length > 0) {
              const featuredProduct = featuredResponse.data[0];
              const mainImage =
                featuredProduct.images?.find((img) => img.isMain)?.url ||
                featuredProduct.images?.[0]?.url ||
                "/images/logo.png";
              
              const imageUrl = mainImage.startsWith("http")
                ? mainImage
                : `${envConfig.NEXT_PUBLIC_BACKEND_URL}${mainImage}`;
              
              setPreviewData({
                image: imageUrl,
                title: item.label,
                price: featuredProduct.price,
                href: item.href,
              });
              setImageOpacity(1);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error("❌ Error fetching featured products:", err);
          }
          
          // Final fallback: use placeholder
          console.log("📝 Using placeholder for:", item.label);
          setPreviewData({
            image: "/images/logo.png",
            title: item.label,
            price: 0,
            href: item.href,
          });
          setImageOpacity(1);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching product preview:", error);
        setPreviewData({
          image: "/images/logo.png",
          title: item.label,
          price: 0,
          href: item.href,
        });
        setImageOpacity(1);
        setIsLoading(false);
      }
    }, 100);
  };

  // Preload first item on mount
  useEffect(() => {
    if (items.length > 0) {
      console.log("🚀 Initializing ProductsMegaMenu with items:", items);
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

  return (
    <div className="grid grid-cols-2 gap-6 p-6 min-w-[600px] max-w-[800px]">
      {/* Left Column - Product Links */}
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => handleMouseEnter(item)}
            className="block px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors duration-200 group"
          >
            <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Column - Sticky Preview Card */}
      <div className="sticky top-4 h-fit">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {previewData ? (
            <>
              {/* Image */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  </div>
                )}
                <Image
                  src={previewData.image}
                  alt={previewData.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover transition-opacity duration-500"
                  style={{ opacity: imageOpacity }}
                  onLoad={() => {
                    setImageOpacity(1);
                    setIsLoading(false);
                  }}
                  onError={() => {
                    setImageOpacity(1);
                    setIsLoading(false);
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                  {previewData.title}
                </h3>
                {previewData.price > 0 ? (
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(previewData.price)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Xem sản phẩm
                  </p>
                )}
                <Link
                  href={previewData.href}
                  className="mt-3 block w-full text-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Xem chi tiết
                </Link>
              </div>
            </>
          ) : (
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

