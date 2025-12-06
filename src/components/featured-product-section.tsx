"use client";
import { useEffect, useState } from "react";
import { Product, ProductCard } from "./product-card";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import useTranslations from "@/i18n/useTranslations";
import { MockModal } from "./mock-model";
import { ProductCardSkeleton } from "@/components/ui/skeleton-loaders";

export const FeaturedProductsSection: React.FC = () => {
  const t = useTranslations();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  
  const categories = ["Tất cả", "Vải Tươi", "Quà Tặng", "Mật Ong"];

  // Fetch featured products from API
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = "/api/products/featured?limit=8";

        const response = await fetch(apiUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(
            "❌ FeaturedProductsSection: API error:",
            response.status,
            errorText
          );
          throw new Error(
            `Failed to fetch featured products: ${response.status} ${errorText}`
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Map backend product format to frontend Product format
          const mappedProducts: Product[] = result.data.map(
            (
              product: {
              _id?: string;
              id?: string | number;
              name?: string;
              price?: number;
              salePrice?: number;
              images?: Array<{ url: string; alt?: string }>;
              category?: string | { name: string };
              rating?: number;
              averageRating?: number;
              description?: string;
              longDescription?: string;
              },
              index: number
            ) => {
              // Get first image from images array or use placeholder
              const imageUrl =
                product.images && product.images.length > 0
                  ? product.images[0].url
                  : "https://placehold.co/400x500/f1f5f9/94a3b8?text=No+Image";

              // Get category name
              const categoryName =
                typeof product.category === "object" && product.category?.name
                  ? product.category.name
                  : product.category || "Sản phẩm";

              // Calculate rating (default to 5 if not available)
              const rating = product.rating || product.averageRating || 5;

              return {
                id: product._id || product.id || `product-${index}`,
                name: product.name || "Sản phẩm",
                price: product.price || product.salePrice || 0,
                category: categoryName,
                image: imageUrl,
                imageUrl: imageUrl,
                rating: Math.min(5, Math.max(1, rating)), // Clamp between 1-5
                longDescription: product.description || product.longDescription,
              };
            }
          );

          setFeaturedProducts(mappedProducts);
        } else {
          console.warn(
            "⚠️ FeaturedProductsSection: No data in response or success=false",
            result
          );
          setFeaturedProducts([]);
        }
      } catch (err) {
        console.error(
          "❌ FeaturedProductsSection: Error fetching featured products:",
          err
        );
        setError("Không thể tải sản phẩm nổi bật");
        // Fallback to empty array or keep previous data
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <>
      <section
        id="products"
        className="py-24 bg-gradient-to-br from-orange-50 via-rose-50/50 to-orange-50 relative overflow-hidden"
      >
        {/* Inject Font Styles (Nếu chưa có ở global) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
            
            .font-heading { font-family: 'Playfair Display', serif; }
            .font-body { font-family: 'Be Vietnam Pro', sans-serif; }
          `,
          }}
        />

        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E11D48' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Decor Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
        <div className="absolute -left-20 top-40 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 bottom-40 w-80 h-80 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-rose-600 font-bold tracking-widest uppercase text-xs mb-3 block">
                Bộ Sưu Tập Độc Quyền
              </span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {t("site.featured_section")}
              </h2>
              <div className="w-20 h-1 bg-rose-600 mx-auto rounded-full mb-6" />
              <p className="font-body text-lg text-slate-500 leading-relaxed">
                Những sáng tạo độc đáo từ{" "}
                <strong className="text-rose-600">LALA-LYCHEE</strong>, kết tinh
                hương vị ngọt ngào của đất trời và tâm huyết của người nông dân.
              </p>
            </motion.div>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg border border-rose-100">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-rose-600 text-white shadow-md"
                      : "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center">
              <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {[...Array(8)].map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Chưa có sản phẩm nổi bật</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {featuredProducts
                  .filter((product) => {
                    if (selectedCategory === "Tất cả") return true;
                    const categoryLower = product.category.toLowerCase();
                    if (selectedCategory === "Vải Tươi") {
                      return categoryLower.includes("vải") || categoryLower.includes("tươi") || categoryLower.includes("fresh");
                    }
                    if (selectedCategory === "Quà Tặng") {
                      return categoryLower.includes("quà") || categoryLower.includes("gift") || categoryLower.includes("set");
                    }
                    if (selectedCategory === "Mật Ong") {
                      return categoryLower.includes("mật") || categoryLower.includes("honey") || categoryLower.includes("ong");
                    }
                    return true;
                  })
                  .map((product, index) => {
                    // Determine badge based on product data or index
                    const isNew = index < 2; // First 2 products are "new"
                    const isBestSeller = index % 3 === 0; // Every 3rd product is "best seller"
                    
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setQuickViewProduct}
                        badge={isNew ? "Mới" : isBestSeller ? "Bán chạy" : undefined}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          {/* View All Button */}
          <div className="text-center mt-16">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-full font-bold hover:bg-slate-900 hover:text-white transition-colors duration-300 shadow-sm"
            >
              <Link href={"/products"}>
                <span>Xem Tất Cả Sản Phẩm</span>
              </Link>
              <ShoppingBag size={18} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <MockModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};
