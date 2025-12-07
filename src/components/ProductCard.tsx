"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/apiRequests/products";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

interface ProductCardProps {
  product: Product;
  locale: string;
  viewMode?: "grid" | "list";
}

const ProductCard = React.memo<ProductCardProps>(
  ({ product, locale, viewMode = "grid" }) => {
    // Safety check: nếu không có _id thì không render
    if (!product?._id) {
      return null;
    }

    const mainImage =
      product.images?.[0]?.url || "https://placehold.co/600x600";
    const imageAlt = product.images?.[0]?.alt || product.name || "Product image";

    return (
      <Link href={`/${locale}/products/${product._id}`}>
        <Card className="group overflow-hidden transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1 h-full">
          <div
            className={`${
              viewMode === "grid" ? "aspect-square" : "h-48"
            } bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative`}
          >
            <Image
              src={mainImage}
              alt={imageAlt}
              fill
              sizes={
                viewMode === "grid"
                  ? "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                  : "(max-width: 768px) 100vw, 50vw"
              }
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

            {/* Stock Status Badge */}
            {product.quantity !== undefined && (
              <Badge
                variant={product.quantity > 0 ? "default" : "destructive"}
                className="absolute top-3 right-3"
              >
                {product.quantity > 0 ? "Còn hàng" : "Hết hàng"}
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            {(product.brandName || product.categoryName) && (
              <Badge variant="outline" className="mb-2 text-xs">
                {product.brandName || product.categoryName}
              </Badge>
            )}

            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(Number(product.price))}
              </span>

              {product.quantity !== undefined && (
                <span className="text-sm text-muted-foreground">
                  SL: {product.quantity}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison để tránh re-render không cần thiết
    // Safety check: nếu không có _id thì luôn re-render
    if (!prevProps.product?._id || !nextProps.product?._id) {
      return false;
    }
    
    return (
      prevProps.product._id === nextProps.product._id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.quantity === nextProps.product.quantity &&
      prevProps.locale === nextProps.locale &&
      prevProps.viewMode === nextProps.viewMode
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;

