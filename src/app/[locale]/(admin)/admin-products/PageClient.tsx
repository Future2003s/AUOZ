"use client";

import { useAdminProducts } from "./hooks/useAdminProducts";
import { ProductsView } from "./components/ProductsView";

export default function PageClient() {
  const productsHook = useAdminProducts();
  return <ProductsView {...productsHook} />;
}
