"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { productApiRequest } from "@/apiRequests/products";

export const backendStatusToUI = (status?: string, fallback?: string) => {
  const raw = status ?? fallback;
  if (!raw) return "DRAFT";
  const normalized = raw.toString().toLowerCase();
  if (normalized === "active") return "ACTIVE";
  if (normalized === "archived" || normalized === "inactive") return "INACTIVE";
  if (normalized === "draft") return "DRAFT";
  return "DRAFT";
};

export const uiStatusToBackend = (status?: string): "active" | "draft" | "archived" | undefined => {
  if (!status) return undefined;
  const normalized = status.toString().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "inactive" || normalized === "archived") return "archived";
  if (normalized === "draft") return "draft";
  return undefined;
};

export const ensurePayloadStatus = (
  payload: Record<string, any> = {},
  product?: { status?: string }
) => {
  // If status is provided in payload, use it. Otherwise fallback to existing product status.
  const resolvedStatus = payload.status ?? product?.status ?? "draft";
  const backendStatus = uiStatusToBackend(resolvedStatus);

  // Always return a value for status that backend understands (lowercase)
  return {
    ...payload,
    status: backendStatus || "draft",
  };
};

export function useAdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const productsPerPage = 12;
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const latestFetchIdRef = useRef(0);
  const fetchProductsRef = useRef<(() => Promise<void>) | null>(null);

  const refreshProducts = useCallback(() => setRefreshToken(Date.now()), []);

  const normalizeProductPayload = (payload: any) => {
    if (!payload) return payload;
    if (payload?.data && typeof payload.data === "object") {
      return payload.data;
    }
    return payload;
  };

  const mapBackendToUI = useCallback((backend: any, fallback?: any) => {
    return {
      id: backend._id || backend.id || fallback?.id,
      name: backend.name || fallback?.name,
      category:
        backend.categoryName ||
        (typeof backend.category === "string"
          ? fallback?.category || backend.category
          : backend.category?.name) ||
        fallback?.category ||
        "",
      price: backend.price ?? fallback?.price ?? 0,
      stock: backend.quantity ?? fallback?.stock ?? 0,
      status: backendStatusToUI(backend.status, fallback?.status),
      sku: backend.sku ?? fallback?.sku,
      brand:
        typeof backend.brand === "string"
          ? fallback?.brand
          : backend.brand?.name || fallback?.brand,
      image:
        backend.images && backend.images.length > 0
          ? typeof backend.images[0] === "string"
            ? backend.images[0]
            : backend.images[0]?.url
          : fallback?.image,
      description: backend.description ?? fallback?.description,
      categoryId:
        typeof backend.category === "string"
          ? backend.category
          : backend.category?._id || fallback?.categoryId,
      brandId:
        typeof backend.brand === "string"
          ? backend.brand
          : backend.brand?._id || fallback?.brandId,
      images: Array.isArray(backend.images)
        ? backend.images.map((img: any) =>
          typeof img === "string" ? img : img.url
        )
        : fallback?.images || [],
      isFeatured: backend.isFeatured ?? fallback?.isFeatured ?? false,
      isVisible: backend.isVisible ?? fallback?.isVisible ?? true,
      translations: backend.translations ?? fallback?.translations,
      createdAt: backend.createdAt ?? fallback?.createdAt,
      updatedAt: backend.updatedAt ?? new Date().toISOString(),
    };
  }, []);

  const applyProductUpdate = useCallback(
    (productId: string, source: any, fallback?: any) => {
      if (!productId) return;
      setProducts((prev) => {
        const existing = fallback || prev.find((p) => p.id === productId) || null;
        const normalizedSource = ensurePayloadStatus({ ...(source || {}) }, existing || undefined);
        const mapped = mapBackendToUI(normalizedSource, existing);
        if (!mapped?.id) return prev;
        const index = prev.findIndex((p) => p.id === mapped.id);
        if (index === -1) return [mapped, ...prev];
        const next = [...prev];
        next[index] = { ...next[index], ...mapped };
        return next;
      });
    },
    [mapBackendToUI]
  );

  const syncProductFromBackend = useCallback(
    async (productId: string, fallbackPayload?: any) => {
      if (!productId) return false;
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (res.ok) {
          const payload = await res.json();
          const normalized = normalizeProductPayload(payload);
          if (normalized) {
            applyProductUpdate(productId, normalized);
            return true;
          }
        } else {
          console.warn("Sync product failed", productId, "status:", res.status);
        }
      } catch (error) {
        console.error("Sync product error:", error);
      }
      if (fallbackPayload) {
        applyProductUpdate(productId, fallbackPayload);
      }
      return false;
    },
    [applyProductUpdate]
  );

  const fetchProducts = useCallback(async () => {
    const fetchId = ++latestFetchIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "all") {
        const backendStatus =
          statusFilter === "ACTIVE"
            ? "active"
            : statusFilter === "INACTIVE"
              ? "archived"
              : statusFilter === "DRAFT"
                ? "draft"
                : statusFilter.toLowerCase();
        params.set("status", backendStatus);
      }
      params.set("page", String(currentPage));
      params.set("size", String(productsPerPage));

      const timestamp = Date.now();
      const url = `/api/products/admin?${params.toString()}&_t=${timestamp}`;

      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        const pagination = data?.pagination || {};
        if (fetchId === latestFetchIdRef.current) {
          setTotalCount(Number(pagination.totalElements || 0));
          setTotalPages(Number(pagination.totalPages || 1));
          setProducts(
            list.map((p: any) => ({
              id: p.id || p._id,
              name: p.name || p.productName || "",
              category: p.categoryName || p.category?.name || "",
              price: p.price || p.basePrice || 0,
              stock: p.stock || p.quantity || p.inventoryQuantity || 0,
              status:
                p.status === "active"
                  ? "ACTIVE"
                  : p.status === "archived"
                    ? "INACTIVE"
                    : p.status === "draft"
                      ? "DRAFT"
                      : p.status || "ACTIVE",
              sku: p.sku || p.code || "",
              brand: p.brandName || p.brand?.name || "",
              isVisible: p.isVisible ?? true,
              image: p.thumbnail || p.imageUrl || (Array.isArray(p.images) && p.images.length > 0 ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url) : ""),
              description: p.description || "",
              categoryId: p.categoryId || p.category?._id || p.category?.id || (typeof p.category === "string" ? p.category : "") || "",
              brandId: p.brandId || p.brand?._id || p.brand?.id || (typeof p.brand === "string" ? p.brand : "") || "",
              images: p.images || [],
              isFeatured: p.isFeatured ?? false,
              translations: p.translations || undefined,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }))
          );
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (error: any) {
      setError(error?.message || "Unknown error occurred");
      console.error("Fetch products failed:", error);
    } finally {
      if (fetchId === latestFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter, productsPerPage]);

  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  const retryWithDelay = (fn: () => void, delay: number = 2000) => {
    setTimeout(() => {
      fn();
    }, delay);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      let res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) {
        res = await fetch("/api/meta/categories", { cache: "no-store" });
      }
      if (res.ok) {
        const responseData = await res.json();
        let categoriesList: any[] = [];
        if (responseData?.success && Array.isArray(responseData.data)) {
          categoriesList = responseData.data;
        } else if (Array.isArray(responseData)) {
          categoriesList = responseData;
        } else if (responseData && Array.isArray(responseData?.data?.data)) {
          categoriesList = responseData.data.data;
        } else if (Array.isArray(responseData?.data)) {
          categoriesList = responseData.data;
        } else if (responseData?.success && responseData?.data && typeof responseData.data === "object") {
          categoriesList = Object.values(responseData.data);
        } else if (responseData?.data && typeof responseData.data === "object" && !Array.isArray(responseData.data)) {
          categoriesList = Object.values(responseData.data);
        }
        const mappedCategories = categoriesList.map((cat: any) => ({
          id: String(cat._id || cat.id || ""),
          name: cat.name || cat.categoryName || "Unknown Category",
        }));
        setCategories(mappedCategories);
      } else {
        if (res.status >= 500) retryWithDelay(fetchCategories, 2000);
      }
    } catch (error) {
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const createNewCategory = useCallback(async (categoryName: string) => {
    try {
      const slug = generateSlug(categoryName);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          slug,
          description: `Category created for: ${categoryName}`,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        await fetchCategories();
        return result.data?._id || result.data?.id || null;
      } else {
        let errorMessage = "Failed to create category";
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => `${e.field}: ${e.message}`).join("; ");
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch { }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const msg = error?.message || "Không thể tạo danh mục mới";
      toast.error(msg);
      return null;
    }
  }, [fetchCategories]);

  const fetchBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const res = await fetch("/api/meta/brands", { cache: "no-store" });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && Array.isArray(responseData.data)) {
          const mapped = responseData.data.map((brand: any) => ({
            id: String(brand._id || brand.id || ""),
            name: brand.name,
          }));
          setBrands(mapped);
        }
      } else {
        if (res.status >= 500) retryWithDelay(fetchBrands, 2000);
      }
    } catch (error) {
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshToken]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stsRes = await fetch(`/api/products/statuses`, { cache: "no-store" });
        let sts: any = [];
        if (stsRes.ok) {
          const t = await stsRes.text();
          const d = t ? JSON.parse(t) : null;
          sts = d?.data || d || [];
        }
        setStatuses(sts);
      } catch {
        setStatuses(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]);
      }
    };
    loadFilters();
  }, []);

  // Make sure we have fetch categories/brands
  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    if (brands.length === 0) fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (productData: any) => {
    try {
      setSaving(true);
      setError(null);

      // Ensure status is valid before sending
      const finalPayload = ensurePayloadStatus(productData);
      const response = await productApiRequest.createProduct("", finalPayload);

      if (response.success) {
        const backend = response.data;
        const mapped = mapBackendToUI(backend, null);

        // Optimistically prepend new product to list
        setProducts((prev) => {
          const withoutDuplicate = prev.filter((p) => p.id !== mapped.id);
          return [mapped, ...withoutDuplicate];
        });

        const forcedStatusAll = statusFilter !== "all";
        if (forcedStatusAll) setStatusFilter("all");
        if (currentPage !== 1) setCurrentPage(1);

        // Single background refetch to sync with server (no syncProductFromBackend)
        if (fetchProductsRef.current) fetchProductsRef.current();

        toast.success(forcedStatusAll ? "Đã tạo sản phẩm mới và hiển thị tất cả trạng thái!" : "Đã tạo sản phẩm mới thành công!");
        return true;
      } else {
        // Enhanced error handling for validation errors
        let errorMessage = response.message || "Không thể tạo sản phẩm";
        if (Array.isArray((response as any).details?.errors)) {
          const details = (response as any).details.errors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join(", ");
          errorMessage = `Lỗi xác thực: ${details}`;
        }

        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (error: any) {
      const msg = error?.message || "Không thể tạo sản phẩm";
      toast.error(msg);
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (targetId: string, productData: any, currentProduct: any) => {
    try {
      setSaving(true);
      setError(null);
      const payloadWithStatus = ensurePayloadStatus({ ...(productData || {}) }, currentProduct || undefined);

      // Optimistic update: apply immediately so UI feels instant
      const optimisticPayload = { ...payloadWithStatus, ...(currentProduct || {}) };
      applyProductUpdate(targetId, payloadWithStatus, currentProduct);

      const response = await productApiRequest.updateProduct("", targetId, payloadWithStatus as any);

      if (!response.success) {
        // Revert optimistic update on failure
        applyProductUpdate(targetId, currentProduct, currentProduct);
        let errorMessage = response.message || "Cập nhật thất bại";
        if (Array.isArray((response as any).details?.errors)) {
          const details = (response as any).details.errors
            .map((e: any) => `${e.field}: ${e.message}`)
            .join(", ");
          errorMessage = `Lỗi xác thực: ${details}`;
        }
        throw new Error(errorMessage);
      }

      toast.success("Cập nhật sản phẩm thành công!");
      // Single background refetch — no second applyProductUpdate → no flicker
      if (fetchProductsRef.current) fetchProductsRef.current();
      return true;
    } catch (error: any) {
      const msg = error.message || "Không thể cập nhật sản phẩm";
      toast.error(msg);
      setError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!productId) {
      toast.error("Không tìm thấy ID sản phẩm");
      return false;
    }
    try {
      setDeletingId(productId);
      const response = await productApiRequest.deleteProduct("", productId);
      if (response.success) {
        // Optimistically remove from list immediately
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success("Đã xóa sản phẩm thành công!");
        // Single background refetch to sync pagination count
        if (fetchProductsRef.current) fetchProductsRef.current();
        return true;
      } else {
        const errorMsg = response.message || "Không thể xóa sản phẩm";
        toast.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa sản phẩm");
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean, product: any) => {
    const updateData: Record<string, any> = { isFeatured: !currentFeatured };
    if (!currentFeatured) {
      if (product?.status !== "ACTIVE") updateData.status = "active";
      if (product?.isVisible === false) updateData.isVisible = true;
    }

    const updateDataWithStatus = ensurePayloadStatus(updateData, product);
    // Optimistic update: immediately reflect the toggle in UI
    applyProductUpdate(productId, updateDataWithStatus, product);

    try {
      setError(null);
      const response = await productApiRequest.updateProduct("", productId, updateDataWithStatus as any);

      if (!response.success) {
        // Revert optimistic update
        applyProductUpdate(productId, product, product);
        let errorMessage = response.message || "Failed to update featured status";
        if (Array.isArray((response as any).details?.errors)) {
          errorMessage = (response as any).details.errors.map((e: any) => e.message).join(", ");
        }
        throw new Error(errorMessage);
      }

      if (!currentFeatured) {
        const autoChanges: string[] = [];
        if (updateData.status === "active") autoChanges.push("chuyển trạng thái sang ACTIVE");
        if (updateData.isVisible === true && product?.isVisible === false) autoChanges.push("bật hiển thị");
        const changeMessage = autoChanges.length > 0 ? ` (đã ${autoChanges.join(" và ")})` : "";
        toast.success(`Đã thêm sản phẩm vào danh sách nổi bật${changeMessage}`);
      } else {
        toast.success("Đã xóa sản phẩm khỏi danh sách nổi bật");
      }
      // Single background refetch — no syncProductFromBackend → no second render
      if (fetchProductsRef.current) fetchProductsRef.current();
    } catch (error: any) {
      const msg = error?.message || "Không thể cập nhật trạng thái nổi bật";
      toast.error(msg);
      setError(msg);
      // Revert already done above; background refetch to ensure consistency
      if (fetchProductsRef.current) fetchProductsRef.current();
    }
  };

  // Products đã được lọc phía server (theo status, categoryId) — không cần lọc lại ở client
  const filteredProducts = products;

  return {
    products,
    filteredProducts,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    productsPerPage,
    categories,
    loadingCategories,
    brands,
    loadingBrands,
    statuses,
    error,
    totalCount,
    totalPages,
    saving,
    deletingId,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleFeatured,
    createNewCategory,
    refreshProducts,
  };
}
