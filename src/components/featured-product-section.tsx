"use client";
import { useEffect, useState } from "react";
import { Product, ProductCard } from "./product-card";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import useTranslations from "@/i18n/useTranslations";
import { MockModal } from "./mock-model";

export const FeaturedProductsSection: React.FC = () => {
  const t = useTranslations();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null
  );
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        className="py-24 bg-gradient-to-b from-white to-rose-50/30 relative overflow-hidden"
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

        {/* Decor Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
        <div className="absolute -left-20 top-40 w-64 h-64 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
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

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center">
              <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 animate-pulse"
                  >
                    <div className="aspect-[4/5] bg-stone-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto" />
                      <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto" />
                    </div>
                  </div>
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
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
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
