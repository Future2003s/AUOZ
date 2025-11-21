"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Image from "next/image";
const ProductModal = dynamic(() => import("./components/ProductModal"), {
  ssr: false,
});
const ProductViewModal = dynamic(
  () => import("./components/ProductViewModal"),
  { ssr: false }
);
import { productApiRequest } from "@/apiRequests/products";
import { useAppContextProvider } from "@/context/app-context";

const backendStatusToUI = (status?: string, fallback?: string) => {
  const raw = status ?? fallback;
  if (!raw) return "DRAFT";
  const normalized = raw.toString().toLowerCase();
  if (normalized === "active") return "ACTIVE";
  if (normalized === "archived" || normalized === "inactive") return "INACTIVE";
  if (normalized === "draft") return "DRAFT";
  return "DRAFT";
};

const uiStatusToBackend = (status?: string) => {
  if (!status) return undefined;
  const normalized = status.toString().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "inactive" || normalized === "archived") return "archived";
  if (normalized === "draft") return "draft";
  return undefined;
};

const ensurePayloadStatus = (
  payload: Record<string, any> = {},
  product?: { status?: string }
) => {
  const resolvedStatus = payload.status ?? product?.status;
  const backendStatus = uiStatusToBackend(resolvedStatus);

  if (!backendStatus) {
    return payload;
  }

  if (payload.status === backendStatus) {
    return payload;
  }

  return {
    ...payload,
    status: backendStatus,
  };
};

export default function PageClient() {
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

  // Modal states
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { sessionToken } = useAppContextProvider();
  const latestFetchIdRef = useRef(0);
  const fetchProductsRef = useRef<(() => Promise<void>) | null>(null);

  const refreshProducts = () => setRefreshToken(Date.now());

  const normalizeProductPayload = (payload: any) => {
    if (!payload) return payload;
    if (payload?.data && typeof payload.data === "object") {
      return payload.data;
    }
    return payload;
  };

  const applyProductUpdate = (
    productId: string,
    source: any,
    fallback?: any
  ) => {
    if (!productId) return;
    setProducts((prev) => {
      const existing = fallback || prev.find((p) => p.id === productId) || null;
      const normalizedSource = ensurePayloadStatus(
        { ...(source || {}) },
        existing || undefined
      );
      const mapped = mapBackendToUI(normalizedSource, existing);
      if (!mapped?.id) {
        return prev;
      }
      const index = prev.findIndex((p) => p.id === mapped.id);
      if (index === -1) {
        return [mapped, ...prev];
      }
      const next = [...prev];
      next[index] = { ...next[index], ...mapped };
      return next;
    });
  };

  const syncProductFromBackend = async (
    productId: string,
    fallbackPayload?: any
  ) => {
    if (!productId) return false;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        cache: "no-store",
      });
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
  };

  // Map backend product object to UI shape
  const mapBackendToUI = (backend: any, fallback?: any) => {
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
      createdAt: backend.createdAt ?? fallback?.createdAt,
      updatedAt: backend.updatedAt ?? new Date().toISOString(),
    };
  };

  // Handler functions (copied from original page)
  const handleUpdate = async (productData: any) => {
    if (!editing?.id) return;
    const targetId = editing.id;
    const currentProduct = editing;
    try {
      setSaving(true);
      const payloadWithStatus = ensurePayloadStatus(
        { ...(productData || {}) },
        editing || undefined
      );
      const response = await productApiRequest.updateProduct(
        sessionToken || "",
        targetId,
        payloadWithStatus
      );
      if (!response.success) {
        throw new Error(response.message || "Cập nhật thất bại");
      }
      const fallbackPayload = {
        ...payloadWithStatus,
        ...(response.data || {}),
      };
      applyProductUpdate(targetId, fallbackPayload, currentProduct);
      setEditing(null);
      toast.success("Cập nhật sản phẩm thành công!");
      await syncProductFromBackend(targetId, fallbackPayload);
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm");
      console.error("Error updating product:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (product) setViewing(product);
    } catch (error) {
      toast.error("Không thể tải chi tiết sản phẩm");
    }
  };

  const handleEdit = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (product) setEditing(product);
    } catch (error) {
      toast.error("Không thể tải thông tin sản phẩm");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      setDeletingId(productId);
      const response = await productApiRequest.deleteProduct(
        sessionToken || "",
        productId
      );
      if (response.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        if (viewing?.id === productId) setViewing(null);
        if (editing?.id === productId) setEditing(null);
        toast.success("Đã xóa sản phẩm thành công!");
        if (fetchProductsRef.current) {
          await fetchProductsRef.current();
        } else {
          refreshProducts();
        }
      } else {
        toast.error(response.message || "Không thể xóa sản phẩm");
      }
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (updatedProduct: any) => {
    if (!editing?.id) return;
    const targetId = editing.id;
    const currentProduct = editing;
    try {
      setSaving(true);
      const payloadWithStatus = ensurePayloadStatus(
        { ...(updatedProduct || {}) },
        currentProduct || undefined
      );
      const response = await productApiRequest.updateProduct(
        sessionToken || "",
        targetId,
        payloadWithStatus
      );
      if (!response.success) {
        throw new Error(response.message || "Cập nhật thất bại");
      }
      const fallbackPayload = {
        ...payloadWithStatus,
        ...(response.data || {}),
      };
      applyProductUpdate(targetId, fallbackPayload, currentProduct);
      setEditing(null);
      toast.success("Cập nhật sản phẩm thành công!");
      await syncProductFromBackend(targetId, fallbackPayload);
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm");
    } finally {
      setSaving(false);
    }
  };
  const handleCreate = async (productData: any) => {
    try {
      console.log("🟢 [PageClient] Creating product with data:", productData);
      setSaving(true);
      const response = await productApiRequest.createProduct(
        sessionToken || "",
        productData
      );
      console.log("🟢 [PageClient] Create product response:", response);

      if (response.success) {
        const backend = response.data;
        console.log("🟢 [PageClient] Created product backend data:", backend);
        const mapped = mapBackendToUI(backend, null);
        console.log("🟢 [PageClient] Mapped product:", mapped);

        setProducts((prev) => {
          const withoutDuplicate = prev.filter((p) => p.id !== mapped.id);
          return [mapped, ...withoutDuplicate];
        });

        const forcedStatusAll = statusFilter !== "all";
        if (forcedStatusAll) {
          console.log(
            "🟡 [PageClient] Resetting status filter to 'all' to show new product"
          );
          setStatusFilter("all");
        }

        if (currentPage !== 1) {
          console.log(
            "🟡 [PageClient] Resetting page to 1 to show newly created product"
          );
          setCurrentPage(1);
        }

        if (mapped.id) {
          await syncProductFromBackend(mapped.id, backend);
        }
        // Trigger a background refetch even if filters/page stay the same
        refreshProducts();

        setCreating(false);
        toast.success(
          forcedStatusAll
            ? "Đã tạo sản phẩm mới và hiển thị tất cả trạng thái để bạn thấy ngay!"
            : "Đã tạo sản phẩm mới thành công!"
        );
      } else {
        const errorMessage = response.message || "Failed to create product";
        console.error("❌ [PageClient] Create product failed:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ [PageClient] Create product error:", error);
      const errorMessage = error?.message || "Không thể tạo sản phẩm";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (
    productId: string,
    currentFeatured: boolean
  ) => {
    const currentProduct = products.find((p) => p.id === productId);
    const updateData: Record<string, any> = {
      isFeatured: !currentFeatured,
    };

    if (!currentFeatured) {
      if (currentProduct?.status !== "ACTIVE") {
        updateData.status = "active";
      }
      if (currentProduct?.isVisible === false) {
        updateData.isVisible = true;
      }
    }

    const updateDataWithStatus = ensurePayloadStatus(
      updateData,
      currentProduct
    );
    applyProductUpdate(productId, updateDataWithStatus, currentProduct);

    try {
      const response = await productApiRequest.updateProduct(
        sessionToken || "",
        productId,
        updateDataWithStatus
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update featured status");
      }

      const fallbackPayload = {
        ...updateDataWithStatus,
        ...(response.data || {}),
      };

      await syncProductFromBackend(productId, fallbackPayload);

      if (!currentFeatured) {
        const autoChanges: string[] = [];
        if (updateData.status === "active") {
          autoChanges.push("chuyển trạng thái sang ACTIVE");
        }
        if (
          updateData.isVisible === true &&
          currentProduct?.isVisible === false
        ) {
          autoChanges.push("bật hiển thị");
        }
        const changeMessage =
          autoChanges.length > 0 ? ` (đã ${autoChanges.join(" và ")})` : "";
        toast.success(`Đã thêm sản phẩm vào danh sách nổi bật${changeMessage}`);
      } else {
        toast.success("Đã xóa sản phẩm khỏi danh sách nổi bật");
      }
    } catch (error: any) {
      console.error("❌ [PageClient] Error toggling featured:", error);
      toast.error(error?.message || "Không thể cập nhật trạng thái nổi bật");
      await syncProductFromBackend(productId);
    }
  };

  const fetchProducts = useCallback(async () => {
    const fetchId = ++latestFetchIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      // Convert frontend status filter to backend format
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

      console.log(
        "🟢 [PageClient] Fetching products with params:",
        params.toString()
      );

      const res = await fetch(`/api/products/admin?${params.toString()}`, {
        cache: "no-store",
      });

      console.log("🟢 [PageClient] Fetch response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("🟢 [PageClient] Fetch response data:", {
          dataLength: data?.data?.length || 0,
          pagination: data?.pagination,
        });

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
              image:
                p.thumbnail ||
                p.imageUrl ||
                (Array.isArray(p.images) && p.images.length > 0
                  ? typeof p.images[0] === "string"
                    ? p.images[0]
                    : p.images[0]?.url
                  : ""),
              description: p.description || "",
              categoryId:
                p.categoryId ||
                p.category?._id ||
                p.category?.id ||
                (typeof p.category === "string" ? p.category : "") ||
                "",
              brandId:
                p.brandId ||
                p.brand?._id ||
                p.brand?.id ||
                (typeof p.brand === "string" ? p.brand : "") ||
                "",
              images: p.images || [],
              isFeatured: p.isFeatured ?? false,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }))
          );
        } else {
          console.debug("Discarded stale products response", fetchId);
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
  // Retry helper
  const retryWithDelay = (fn: () => void, delay: number = 2000) => {
    setTimeout(() => {
      fn();
    }, delay);
  };

  // Helper function to generate slug from name
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

  // Categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      // Try public proxy first; fallback to meta proxy
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
        } else if (
          responseData?.success &&
          responseData?.data &&
          typeof responseData.data === "object"
        ) {
          categoriesList = Object.values(responseData.data);
        } else if (
          responseData?.data &&
          typeof responseData.data === "object" &&
          !Array.isArray(responseData.data)
        ) {
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
      // keep categories empty
    } finally {
      setLoadingCategories(false);
    }
  };

  // Create new category
  const createNewCategory = async (categoryName: string) => {
    try {
      const slug = generateSlug(categoryName);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          name: categoryName,
          slug,
          description: `Category created for: ${categoryName}`,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        await fetchCategories();
        return result.data?._id || result.data?.id;
      } else {
        let errorMessage = "Failed to create category";
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors
              .map((e: any) => `${e.field}: ${e.message}`)
              .join("; ");
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const msg = error?.message || "Không thể tạo danh mục mới";
      toast.error(msg);
      return null;
    }
  };

  // Brands
  const fetchBrands = async () => {
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
      // ignore
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshToken]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stsRes = await fetch(`/api/products/statuses`, {
          cache: "no-store",
        });
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
  // Load categories & brands when opening create modal
  // Ensure categories/brands are loaded on mount (covers Edit modal case)
  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    if (brands.length === 0) fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also ensure data is available when opening Edit modal
  useEffect(() => {
    if (editing) {
      if (categories.length === 0) fetchCategories();
      if (brands.length === 0) fetchBrands();
    }
  }, [editing]);

  useEffect(() => {
    if (creating) {
      if (categories.length === 0) fetchCategories();
      if (brands.length === 0) fetchBrands();
    }
  }, [creating]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader
          isLoading={true}
          message="Đang tải danh sách sản phẩm..."
          size="lg"
          overlay={false}
        />
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      categoryFilter === "all" || product.categoryId === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "OUT_OF_STOCK":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "OUT_OF_STOCK":
        return "bg-yellow-100 text-yellow-800";
      case "DISCONTINUED":
        return "bg-gray-100 text-gray-800";
      case "DRAFT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock < 10) return "secondary";
    return "default";
  };

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục sản phẩm và kho hàng
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={() => setCreating(true)}
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm mới
        </Button>
      </div>
      {/* Filters and Search */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên sản phẩm, SKU, thương hiệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue
                    placeholder={loadingCategories ? "Đang tải..." : "Danh mục"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {loadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Đang tải danh mục...
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" /> Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Products Grid */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Package className="h-5 w-5 text-blue-600" /> Danh sách sản phẩm (
            {filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white"
              >
                <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                  {/* Featured Badge */}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1.5 shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {product.brand}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={getStockBadgeVariant(product.stock) as any}
                      className={`text-xs ${getStockBadgeColor(product.stock)}`}
                    >
                      {product.stock === 0
                        ? "Hết hàng"
                        : `${product.stock} cái`}
                    </Badge>
                    <Badge
                      variant={getStatusBadgeVariant(product.status) as any}
                      className={`text-xs ${getStatusBadgeColor(
                        product.status
                      )}`}
                    >
                      {product.status}
                    </Badge>
                  </div>
                  {/* Featured Toggle Button */}
                  <div className="pt-2">
                    <Button
                      variant={product.isFeatured ? "default" : "outline"}
                      size="sm"
                      className={`w-full ${
                        product.isFeatured
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                          : "hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300"
                      } transition-all`}
                      onClick={() =>
                        handleToggleFeatured(
                          product.id,
                          product.isFeatured || false
                        )
                      }
                    >
                      <Star
                        className={`h-4 w-4 mr-2 ${
                          product.isFeatured ? "fill-current" : ""
                        }`}
                      />
                      {product.isFeatured ? "Đã nổi bật" : "Đánh dấu nổi bật"}
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                      onClick={() => handleView(product.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                      onClick={() => handleEdit(product.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? (
                        <Loader isLoading={true} size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {error
                ? "Không thể tải danh sách sản phẩm"
                : "Không tìm thấy sản phẩm nào"}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {(currentPage - 1) * productsPerPage + 1} đến{" "}
            {Math.min(currentPage * productsPerPage, totalCount)} trong tổng số{" "}
            {totalCount} sản phẩm
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
      {/* Modals */}
      {creating && (
        <ProductModal
          isOpen={creating}
          onClose={() => setCreating(false)}
          mode="create"
          onSave={handleCreate}
          categories={categories}
          brands={brands}
          onCreateCategory={createNewCategory}
        />
      )}
      {editing && (
        <ProductModal
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          product={editing}
          mode="edit"
          onSave={handleUpdate}
          categories={categories}
          brands={brands}
          onCreateCategory={createNewCategory}
        />
      )}
      {viewing && (
        <ProductViewModal
          isOpen={!!viewing}
          onClose={() => setViewing(null)}
          product={viewing}
          onEdit={() => {
            setViewing(null);
            handleEdit(viewing.id);
          }}
          onDelete={() => {
            setViewing(null);
            handleDelete(viewing.id);
          }}
        />
      )}
    </div>
  );
}
