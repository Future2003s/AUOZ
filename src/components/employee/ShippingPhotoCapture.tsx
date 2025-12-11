"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Camera,
  DollarSign,
  Package,
  Image as ImageIcon,
  CheckSquare,
  User,
  ArrowLeft,
  X,
  Hash,
  Plus,
  Trash2,
  PlusCircle,
  Building,
  Truck,
  Tag,
  Loader2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface Product {
  _id: string;
  id?: string;
  name: string;
  price?: number;
  salePrice?: number;
  sku?: string;
}

interface Buyer {
  _id: string;
  id?: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Category {
  _id?: string;
  id?: string;
  name?: string;
}

interface OrderItem {
  id?: string | null; // null for new items, string for existing items from backend
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const generateOrderCode = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return `LALC${month}${year}-${random}`;
};

export default function ShippingPhotoCapture() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const [orderCode, setOrderCode] = useState<string>(() => generateOrderCode());
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    buyerId: "",
    buyerName: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    note: "",
    isInvoice: false,
    isDebt: false,
    isShipped: false,
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [currentInput, setCurrentInput] = useState({
    name: "",
    quantity: "1",
    price: "",
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [showBuyerSuggestions, setShowBuyerSuggestions] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [modalProductData, setModalProductData] = useState({
    name: "",
    price: "",
    quantity: "1",
  });
  const [createProductModalData, setCreateProductModalData] = useState({
    name: "",
    price: "",
    description: "",
    sku: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buyerWrapperRef = useRef<HTMLDivElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Load products from API - only when needed (lazy loading)
  const loadProducts = useCallback(async (searchTerm?: string) => {
    try {
      setLoadingProducts(true);
      // Only fetch 20 products for autocomplete, not 100
      const url = searchTerm
        ? `/api/products/public?page=1&size=20&status=active&q=${encodeURIComponent(searchTerm)}`
        : `/api/products/public?page=1&size=20&status=active`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Failed to fetch products:", response.status);
        return;
      }
      
      const data = await response.json();

      // API returns { data: [...], pagination: {...} } format
      if (data.data) {
        const productsList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
        if (searchTerm) {
          setSearchProducts(productsList);
        } else {
          setProducts(productsList);
        }
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load buyers from API
  const loadBuyers = useCallback(async () => {
    try {
      setLoadingBuyers(true);
      const response = await fetch("/api/buyers", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      
      if (!response.ok) {
        console.error("Failed to fetch buyers:", response.status);
        return;
      }
      
      const data = await response.json();

      // Handle different response formats
      // Format 1: { success: true, data: [...] }
      // Format 2: { data: [...] }
      // Format 3: { data: { content: [...] } }
      // Format 4: Direct array [...]
      let buyersList: Buyer[] = [];
      
      if (Array.isArray(data)) {
        buyersList = data;
      } else if (data.data) {
        buyersList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
      } else if (data.success && data.data) {
        buyersList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
      }
      
      if (buyersList.length > 0) {
        setBuyers(buyersList);
      }
    } catch (error) {
      console.error("Error loading buyers:", error);
    } finally {
      setLoadingBuyers(false);
    }
  }, []);

  // Load default category (first available category)
  const loadDefaultCategory = useCallback(async () => {
    try {
      const response = await fetch("/api/categories?limit=1");
      const data = await response.json();

      if (data.success && data.data) {
        const categoriesList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
        
        if (categoriesList.length > 0) {
          setDefaultCategoryId(categoriesList[0]._id || categoriesList[0].id);
        } else {
          console.warn("No categories found. Please create a category first.");
        }
      }
    } catch (error) {
      console.error("Error loading default category:", error);
    }
  }, []);

  // Load all categories for dropdown
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Categories API response error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        toast.error("Không thể tải danh mục");
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        const categoriesList = Array.isArray(data.data)
          ? data.data
          : data.data.content || [];
        
        setCategories(categoriesList);
        
        // Set default category if list is not empty and not already set
        if (categoriesList.length > 0) {
          setSelectedCategoryId((currentSelected) => {
            if (!currentSelected) {
              const firstCategoryId = categoriesList[0]._id || categoriesList[0].id;
              setDefaultCategoryId((currentDefault) => {
                if (!currentDefault) {
                  return firstCategoryId;
                }
                return currentDefault;
              });
              return firstCategoryId;
            }
            return currentSelected;
          });
        }
      } else {
        console.warn("Invalid categories response format:", data);
        toast.error("Định dạng dữ liệu danh mục không hợp lệ");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Lỗi khi tải danh mục: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }, []);

  // Load initial data in parallel for better performance
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingInitial(true);
      try {
        await Promise.all([
          loadBuyers(),
          loadDefaultCategory(),
          loadCategories(),
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    loadInitialData();
    // Don't load products upfront - lazy load when needed
  }, [loadBuyers, loadDefaultCategory, loadCategories]);

  // Total is now calculated with useMemo - no need for this useEffect

  // Generate SKU from product name
  const generateSKU = (name: string): string => {
    const timestamp = Date.now().toString().slice(-6);
    const namePart = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
      .padEnd(6, "X");
    return `${namePart}-${timestamp}`;
  };

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowProductSuggestions(false);
      }
      if (
        buyerWrapperRef.current &&
        !buyerWrapperRef.current.contains(event.target as Node)
      ) {
        setShowBuyerSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "buyerName" && value.length >= 1) {
      setShowBuyerSuggestions(true);
    }
  };

  // Format input number with dots
  const formatInputNumber = (val: string) => {
    const number = val.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "price") {
      setCurrentInput((prev) => ({
        ...prev,
        [name]: formatInputNumber(value),
      }));
    } else if (name === "name") {
      setCurrentInput((prev) => ({ ...prev, [name]: value }));
      // Debounced search will be triggered by fetchProducts
      if (value.length >= 1) {
        fetchProducts(value);
        // Keep suggestions open when typing
        setShowProductSuggestions(true);
      } else {
        // When text is cleared, clear search results and show all products
        setSearchProducts([]);
        // Keep suggestions open to show all available products
        if (showProductSuggestions) {
          // If suggestions are already open, keep them open to show all products
          // filteredProducts will return all products when name is empty
        }
      }
    } else {
      setCurrentInput((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch products for autocomplete with debouncing
  const fetchProducts = useCallback((searchTerm: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm || searchTerm.length < 1) {
      setShowProductSuggestions(false);
      setSearchProducts([]);
      return;
    }

    // Debounce search - wait 300ms before making API call
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        const response = await fetch(
          `/api/products/public?page=1&size=20&q=${encodeURIComponent(searchTerm)}`
        );
        
        if (!response.ok) {
          console.error("Failed to fetch products:", response.status);
          setSearchProducts([]);
          setShowProductSuggestions(false);
          return;
        }
        
        const data = await response.json();

        // API returns { data: [...], pagination: {...} } format
        if (data.data) {
          const productsList = Array.isArray(data.data)
            ? data.data
            : data.data.content || [];
          setSearchProducts(productsList);
          setShowProductSuggestions(productsList.length > 0 || searchTerm.length > 0);
        } else {
          setSearchProducts([]);
          setShowProductSuggestions(false);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setSearchProducts([]);
        setShowProductSuggestions(false);
      } finally {
        setLoadingProducts(false);
      }
    }, 300);
  }, []);

  // Add new product via API
  const createProduct = async (
    name: string,
    price: number,
    sku?: string,
    categoryId?: string,
    description?: string
  ) => {
    try {
      // Use provided categoryId or fallback to defaultCategoryId
      let finalCategoryId = categoryId || defaultCategoryId;
      if (!finalCategoryId) {
        await loadDefaultCategory();
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        finalCategoryId = defaultCategoryId;
      }

      if (!finalCategoryId) {
        throw new Error("Không tìm thấy danh mục. Vui lòng tạo danh mục trước khi tạo sản phẩm.");
      }

      const finalSku = sku || generateSKU(name);

      const productData: {
        name: string;
        price: number;
        sku: string;
        category: string;
        status: string;
        description?: string;
      } = {
        name,
        price,
        sku: finalSku,
        category: finalCategoryId,
        status: "active",
      };

      // Description is optional - only include if provided and not empty
      if (description !== undefined && description !== null && description.trim()) {
        productData.description = description.trim();
      }

      console.log("Creating product with data:", productData);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create product API response error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Create product response:", data);

      if (data.success && data.data) {
        const newProduct = data.data;
        setProducts((prev) => [newProduct, ...prev]);
        return newProduct;
      }
      throw new Error(data.message || data.error || "Failed to create product");
    } catch (error) {
      console.error("Error creating product:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Không thể tạo sản phẩm: ${errorMessage}`);
      throw error;
    }
  };

  // Add new buyer via API
  const createBuyer = async (name: string) => {
    try {
      const response = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create buyer API response error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Create buyer response:", data);

      if (data.success && data.data) {
        const newBuyer = data.data;
        setBuyers((prev) => [newBuyer, ...prev]);
        return newBuyer;
      }
      throw new Error(data.message || data.error || "Failed to create buyer");
    } catch (error) {
      console.error("Error creating buyer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Không thể tạo khách hàng: ${errorMessage}`);
      throw error;
    }
  };

  // Add item to order (local state, will be saved to backend later)
  const addItem = () => {
    if (!currentInput.name.trim()) return;

    const qty = parseFloat(currentInput.quantity) || 1;
    const price = parseFloat(currentInput.price.replace(/\./g, "")) || 0;
    const total = qty * price;

    const newItem: OrderItem = {
      id: null, // New item, no ID yet
      name: currentInput.name,
      quantity: qty,
      price: price,
      total: total,
    };

    setItems([...items, newItem]);
    setCurrentInput({ name: "", quantity: "1", price: "" });
    setShowProductSuggestions(false);
  };

  // Handle modal product add
  const handleModalAddProduct = () => {
    if (!modalProductData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    const priceValue = modalProductData.price.replace(/\./g, "").trim();
    if (!priceValue) {
      toast.error("Vui lòng nhập giá sản phẩm");
      return;
    }

    const price = parseFloat(priceValue);
    if (isNaN(price) || price <= 0) {
      toast.error("Giá sản phẩm phải là số dương");
      return;
    }

    const qty = parseFloat(modalProductData.quantity) || 1;
    if (qty <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }

    const total = qty * price;

    const newItem: OrderItem = {
      id: null,
      name: modalProductData.name.trim(),
      quantity: qty,
      price: price,
      total: total,
    };

    setItems([...items, newItem]);
    setModalProductData({ name: "", price: "", quantity: "1" });
    setShowAddProductModal(false);
    toast.success("Đã thêm sản phẩm vào đơn hàng");
  };

  // Remove item
  const removeItem = (itemId: string | null | undefined, index: number) => {
    if (itemId) {
      // Existing item - will be deleted on backend
      setItems(items.filter((item, idx) => item.id !== itemId || idx !== index));
    } else {
      // New item - just remove from local state
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  // Select product from suggestions
  const selectProduct = (product: Product) => {
    const price = product.salePrice || product.price || 0;
    setCurrentInput((prev) => ({
      ...prev,
      name: product.name,
      price: formatInputNumber(price.toString()),
    }));
    setShowProductSuggestions(false);
    setTimeout(() => priceInputRef.current?.focus(), 100);
  };

  // Handle "Add new product" click - open modal
  const handleAddNewProduct = () => {
    const productName = currentInput.name.trim();
    if (!productName) return;

    // Open create product modal with pre-filled name
    const priceValue = currentInput.price.replace(/\./g, "").trim();
    setCreateProductModalData({
      name: productName,
      price: priceValue ? formatInputNumber(priceValue) : "",
      description: "",
      sku: generateSKU(productName),
    });
    setShowCreateProductModal(true);
    setShowProductSuggestions(false);
  };

  // Handle create product from modal
  const handleCreateProductFromModal = async () => {
    if (!createProductModalData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    const priceValue = createProductModalData.price.replace(/\./g, "").trim();
    if (!priceValue) {
      toast.error("Vui lòng nhập giá sản phẩm");
      return;
    }

    const price = parseFloat(priceValue);
    if (isNaN(price) || price <= 0) {
      toast.error("Giá sản phẩm phải là số dương");
      return;
    }

    if (!selectedCategoryId) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    try {
      const newProduct = await createProduct(
        createProductModalData.name.trim(),
        price,
        createProductModalData.sku || generateSKU(createProductModalData.name),
        selectedCategoryId,
        createProductModalData.description
      );
      
      // Update current input with new product
      setCurrentInput((prev) => ({
        ...prev,
        name: newProduct.name,
        price: formatInputNumber((newProduct.price || newProduct.salePrice || 0).toString()),
      }));
      
      setShowCreateProductModal(false);
      setCreateProductModalData({ name: "", price: "", description: "", sku: "" });
      toast.success("Đã tạo sản phẩm mới thành công");
      setTimeout(() => priceInputRef.current?.focus(), 100);
    } catch {
      // Error already handled in createProduct
    }
  };

  // Select buyer from suggestions
  const selectBuyer = (buyer: Buyer) => {
    setFormData((prev) => ({
      ...prev,
      buyerId: buyer._id || buyer.id || "",
      buyerName: buyer.name,
    }));
    setShowBuyerSuggestions(false);
  };

  // Handle "Add new buyer" click
  const handleAddNewBuyer = async () => {
    const buyerName = formData.buyerName.trim();
    if (!buyerName) return;

    try {
      const newBuyer = await createBuyer(buyerName);
      setFormData((prev) => ({
        ...prev,
        buyerId: newBuyer._id || newBuyer.id || "",
        buyerName: newBuyer.name,
      }));
      setShowBuyerSuggestions(false);
    } catch {
      // Error already handled in createBuyer
    }
  };

  // Memoize filtered products to avoid recalculating on every render
  const filteredProducts = useMemo(() => {
    // If there's a search term, use searchProducts (from API search) or filter products
    if (currentInput.name && currentInput.name.length >= 1) {
      const searchTerm = currentInput.name.toLowerCase();
      // Use searchProducts if available (from API), otherwise filter local products
      const sourceProducts = searchProducts.length > 0 ? searchProducts : products;
      return sourceProducts.filter((p) =>
        p.name.toLowerCase().includes(searchTerm)
      );
    }
    // If no search term but products are loaded, show all products (for initial display)
    return products;
  }, [currentInput.name, products, searchProducts]);

  // Memoize filtered buyers to avoid recalculating on every render
  const filteredBuyers = useMemo(() => {
    // If no search term, show all buyers (for initial display when focusing)
    if (!formData.buyerName || formData.buyerName.length < 1) {
      return buyers;
    }
    // If there's a search term, filter buyers
    const searchTerm = formData.buyerName.toLowerCase();
    return buyers.filter((b) =>
      b.name.toLowerCase().includes(searchTerm)
    );
  }, [formData.buyerName, buyers]);

  const handleCheckboxChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev],
    }));
  };

  // Upload photo to backend
  // Standardized response format: { success: true, data: { url: string }, message: string }
  const uploadPhoto = async (file: File): Promise<string> => {
    setIsUploadingPhoto(true);
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Chỉ chấp nhận file ảnh");
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Kích thước ảnh không được vượt quá 10MB");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      console.log("[Upload] Uploading file:", { name: file.name, size: file.size, type: file.type });

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMessage = "Không thể tải ảnh lên";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error("[Upload] Error response:", errorMessage);
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();
      console.log("[Upload] Response data:", data);

      // Validate response format
      if (!data.success || !data.data || !data.data.url) {
        console.error("[Upload] Invalid response format:", data);
        throw new Error(data.message || "Định dạng phản hồi không hợp lệ");
      }

      const imageUrl = data.data.url;
      console.log("[Upload] Upload successful, image URL:", imageUrl);
      return imageUrl;

    } catch (error) {
      console.error("[Upload] Upload photo error:", error);
      throw error;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Reset input value first to allow selecting the same file again
    e.target.value = "";
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 10MB");
      return;
    }

    // Show preview immediately for better UX
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    try {
      const uploadedUrl = await uploadPhoto(file);
      console.log("[Upload] Uploaded URL:", uploadedUrl);
      
      // Set both URL and preview after successful upload
      setPhotoUrl(uploadedUrl);
      // Preview is already set from FileReader above
      
      toast.success("Đã tải ảnh lên thành công");
    } catch (error) {
      console.error("[Upload] Error uploading photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tải ảnh lên";
      toast.error(errorMessage);
      
      // Clear preview on error
      setPhotoPreview(null);
      setPhotoUrl(null);
    }
  };

  // Start webcam
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Không thể truy cập camera. Vui lòng chọn ảnh từ file.");
      fileInputRef.current?.click();
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture photo from webcam
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Không thể chụp ảnh. Vui lòng thử lại.");
      return;
    }

    try {
      // Set canvas dimensions and draw video frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert to data URL and show preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPhotoPreview(dataUrl);
      stopCamera();

      // Convert base64 to File and upload
      const blob = await fetch(dataUrl).then((r) => r.blob());
      const file = new File([blob], `photo-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Upload using the same uploadPhoto function
      const uploadedUrl = await uploadPhoto(file);
      console.log("[Capture] Uploaded URL:", uploadedUrl);
      
      // Set URL after successful upload
      setPhotoUrl(uploadedUrl);
      
      toast.success("Đã chụp và tải ảnh lên thành công");
    } catch (error) {
      console.error("[Capture] Error uploading captured photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể tải ảnh lên";
      toast.error(errorMessage);
      
      // Clear preview on error
      setPhotoPreview(null);
      setPhotoUrl(null);
    }
  };

  const triggerCamera = async () => {
    try {
      await startCamera();
    } catch {
      fileInputRef.current?.click();
    }
  };

  const triggerGallery = () => {
    fileInputGalleryRef.current?.click();
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (fileInputGalleryRef.current) fileInputGalleryRef.current.value = "";
  };

  const formatCurrency = (value: number | string) => {
    if (!value) return "0 ₫";
    const number =
      typeof value === "string" ? parseInt(value.replace(/\D/g, ""), 10) : value;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(number);
  };

  // Memoize total amount calculation
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const goToOrders = () => {
    router.push(`/${locale}/employee/orders`);
  };

  // Save/Complete order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }

    if (!formData.buyerName || !formData.buyerName.trim()) {
      toast.error("Vui lòng nhập đơn vị mua hàng.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        orderCode,
        buyerId: formData.buyerId || undefined,
        buyerName: formData.buyerName.trim(),
        deliveryDate: formData.deliveryDate,
        items: items.map((item) => ({
          productId: item.productId || undefined,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        amount: totalAmount,
        isInvoice: formData.isInvoice,
        isDebt: formData.isDebt,
        isShipped: formData.isShipped,
        proofImage: photoUrl || undefined,
        note: formData.note || "",
        status: "completed",
      };

      const response = await fetch(`/api/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save order");
      }

      if (!data.success && !data.data) {
        throw new Error(data.message || "Failed to save order");
      }

      const savedOrder = data.data;

      // Show success
      const successMessages = ["Đã lưu đơn hàng thành công!"];
      if (formData.isInvoice) {
        successMessages.push("Đã tạo nhắc nhở xuất hóa đơn");
      }
      if (formData.isDebt) {
        successMessages.push("Đã tạo công nợ thành công");
      }

      toast.success(successMessages.join(", "));

      // Create invoice reminder if needed
      if (formData.isInvoice) {
        try {
          const invoiceResponse = await fetch("/api/invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: formData.buyerName,
              orderIds: [],
              deadline: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              notes: formData.note || `Hóa đơn cho đơn hàng ${savedOrder.orderCode}`,
            }),
          });

          const invoiceData = await invoiceResponse.json();
          if (invoiceData.success || invoiceData.data) {
            const pendingInvoices = JSON.parse(
              localStorage.getItem("pendingInvoices") || "[]"
            );
            pendingInvoices.push({
              orderId: savedOrder._id || savedOrder.id,
              orderNumber: savedOrder.orderCode,
              customerName: formData.buyerName,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem(
              "pendingInvoices",
              JSON.stringify(pendingInvoices)
            );
          }
        } catch (error) {
          console.error("Error creating invoice:", error);
        }
      }

      // Create debt if needed
      if (formData.isDebt && totalAmount > 0) {
        try {
          const debtResponse = await fetch("/api/debt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: formData.buyerName,
              orderNumber: savedOrder.orderCode,
              amount: totalAmount,
              dueDate: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              notes:
                formData.note ||
                `Công nợ cho đơn hàng ${savedOrder.orderCode}. Sản phẩm: ${items.map((i) => `${i.name} (${i.quantity}x)`).join(", ")}`,
            }),
          });

          const debtData = await debtResponse.json();
          if (debtData.success || debtData.data) {
            // Redirect to debt management page
            setTimeout(() => {
              router.push(`/${locale}/employee/debt`);
            }, 1500);
            return;
          }
        } catch (error) {
          console.error("Error creating debt:", error);
        }
      }

      // Reset form and generate new order code
      setOrderCode(generateOrderCode());
      setItems([]);
      setFormData({
        buyerId: "",
        buyerName: "",
        deliveryDate: new Date().toISOString().split("T")[0],
        note: "",
        isInvoice: false,
        isDebt: false,
        isShipped: false,
      });
      setPhotoUrl(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error(
        "Lỗi khi lưu đơn hàng: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup camera and search timeout on unmount
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [stream]);

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl min-h-screen sm:min-h-0 sm:my-8 sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <button
            onClick={() => router.push(`/${locale}/employee`)}
            className="p-2 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Đơn Hàng Mới</h1>
            <button
              onClick={goToOrders}
              title="Tổng hợp đơn hàng"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ListChecks size={18} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-5 space-y-6 overflow-y-auto pb-24">
          {/* Thông tin chung */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Mã đơn
                </label>
                <div className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-mono text-sm font-bold flex items-center gap-1">
                  <Hash size={12} className="text-gray-400" />
                  <span className="truncate">
                    {orderCode || "..."}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Ngày giao
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 relative" ref={buyerWrapperRef}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building size={16} className="text-blue-500" />
                Đơn vị mua hàng
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleFormChange}
                  onFocus={async () => {
                    // Always show suggestions when focusing
                    setShowBuyerSuggestions(true);
                    
                    // Load buyers if not already loaded
                    if (buyers.length === 0) {
                      await loadBuyers();
                    }
                  }}
                  placeholder="Tìm hoặc nhập tên khách hàng..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  autoComplete="off"
                  required
                />
                {loadingBuyers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {showBuyerSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {loadingBuyers ? (
                      <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : filteredBuyers.length > 0 ? (
                      <>
                        {filteredBuyers.map((buyer) => (
                          <div
                            key={buyer._id || buyer.id}
                            onClick={() => selectBuyer(buyer)}
                            className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-600 flex items-center gap-3"
                          >
                            <User size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {buyer.name}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      !loadingBuyers && (
                        <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                          {formData.buyerName.trim().length > 0
                            ? "Không tìm thấy khách hàng"
                            : "Chưa có khách hàng nào"}
                        </div>
                      )
                    )}
                    {formData.buyerName.trim().length > 0 && (
                      <div
                        onClick={handleAddNewBuyer}
                        className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 bg-white dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600"
                      >
                        <PlusCircle
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                        <span className="text-green-700 dark:text-green-400 text-sm font-semibold">
                          Thêm mới: &quot;{formData.buyerName}&quot;
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Section: Nhập Sản phẩm & Giá */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Package size={16} className="text-blue-500" />
                Chi tiết hàng hoá
              </label>
              <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                {items.length} món
              </span>
            </div>

            {/* Form thêm sản phẩm */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 space-y-3">
              {/* Tên sản phẩm */}
              <div className="relative" ref={wrapperRef}>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={currentInput.name}
                    onChange={handleInputChange}
                    onFocus={async () => {
                      // Always show suggestions when focusing
                      setShowProductSuggestions(true);
                      
                      if (currentInput.name.length >= 1) {
                        // If there's text, search for products
                        fetchProducts(currentInput.name);
                      } else {
                        // If no text, load initial products list to show all available products
                        // Always load to ensure fresh data
                        await loadProducts();
                        // Clear search results to show all products
                        setSearchProducts([]);
                      }
                    }}
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    autoComplete="off"
                  />
                  {loadingProducts && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {showProductSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {filteredProducts.length > 0 && (
                      <>
                        {filteredProducts.map((product) => (
                          <div
                            key={product._id || product.id}
                            onClick={() => selectProduct(product)}
                            className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-600 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-blue-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {product.name}
                              </span>
                            </div>
                            {(product.salePrice || product.price) && (
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {formatCurrency(
                                  product.salePrice || product.price || 0
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {currentInput.name.trim().length > 0 && (
                      <div
                        onClick={handleAddNewProduct}
                        className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 bg-white dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600"
                      >
                        <PlusCircle
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                        <span className="text-green-700 dark:text-green-400 text-sm font-semibold">
                          Thêm mới: {`"${currentInput.name}"`}
                          {currentInput.price && (
                            <span className="text-gray-500 ml-2">
                              - {formatCurrency(parseFloat(currentInput.price.replace(/\./g, "")))}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Giá và Số lượng */}
              <div className="flex gap-2">
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Tag size={14} />
                  </span>
                  <input
                    ref={priceInputRef}
                    type="text"
                    inputMode="numeric"
                    name="price"
                    value={currentInput.price}
                    onChange={handleInputChange}
                    placeholder="Đơn giá"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                </div>
                <div className="relative w-1/4">
                  <input
                    type="number"
                    name="quantity"
                    value={currentInput.quantity}
                    onChange={handleInputChange}
                    placeholder="SL"
                    min="1"
                    className="w-full px-2 py-2 rounded-lg border border-blue-200 dark:border-blue-800 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center font-medium text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!currentInput.name}
                  className="w-1/4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center justify-center active:scale-95 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Danh sách đã thêm */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.length === 0 ? (
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="w-full py-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Plus size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Thêm sản phẩm
                  </p>
                </button>
              ) : (
                <>
                  {items.map((item, index) => (
                  <div
                    key={item.id || `new-${index}`}
                    className="flex flex-col p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                          {item.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, index)}
                        className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pl-7">
                      <div className="flex gap-3">
                        <span>
                          SL:{" "}
                          <b className="text-blue-600 dark:text-blue-400">
                            {item.quantity}
                          </b>
                        </span>
                        <span>x</span>
                        <span>{formatCurrency(item.price)}</span>
                      </div>
                      <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                  ))}
                  {/* Nút thêm sản phẩm khi đã có sản phẩm */}
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="w-full py-3 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Thêm sản phẩm khác
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Tổng tiền Tự động */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <DollarSign size={16} />
                Tổng thanh toán
              </label>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                Tự động tính
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 text-right tracking-tight">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Chụp ảnh */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Camera size={16} className="text-blue-500" />
              Hình ảnh xác nhận
            </label>

            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              capture="user"
              ref={fileInputGalleryRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Webcam view */}
            {isCameraOpen ? (
              <div className="space-y-3">
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={stopCamera}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                    title="Đóng camera"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Chụp ảnh
                  </button>
                </div>
              </div>
            ) : !photoPreview ? (
              <div className="grid grid-cols-2 gap-2">
                {/* Chụp ảnh - Webcam hoặc file picker */}
                <div
                  onClick={triggerCamera}
                  className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all active:scale-95"
                >
                  <Camera size={20} className="mb-1" />
                  <span className="text-xs text-center px-2">Chụp ảnh</span>
                </div>

                {/* Chọn từ thư viện */}
                <div
                  onClick={triggerGallery}
                  className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all active:scale-95"
                >
                  <ImageIcon size={20} className="mb-1" />
                  <span className="text-xs text-center px-2">Chọn ảnh</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-md group">
                <Image
                  src={photoPreview || ""}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang tải ảnh...</span>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button
                    onClick={triggerCamera}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/40 transition"
                    title="Chụp ảnh mới"
                  >
                    <Camera size={20} />
                  </button>
                  <button
                    onClick={triggerGallery}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/40 transition"
                    title="Chọn ảnh khác"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    onClick={removePhoto}
                    className="p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition"
                    title="Xóa ảnh"
                  >
                    <X size={20} />
                  </button>
                </div>
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors md:hidden"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Tùy chọn */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => handleCheckboxChange("isInvoice")}
              className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                formData.isInvoice
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  formData.isInvoice
                    ? "bg-blue-500 border-blue-500"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                }`}
              >
                {formData.isInvoice && (
                  <CheckSquare size={12} className="text-white" />
                )}
              </div>
              <span className="text-xs font-bold">Xuất hoá đơn</span>
            </div>
            <div
              onClick={() => handleCheckboxChange("isDebt")}
              className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                formData.isDebt
                  ? "bg-orange-50 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-400"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  formData.isDebt
                    ? "bg-orange-500 border-orange-500"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                }`}
              >
                {formData.isDebt && (
                  <CheckSquare size={12} className="text-white" />
                )}
              </div>
              <span className="text-xs font-bold">Vào công nợ</span>
            </div>
            <div
              onClick={() => handleCheckboxChange("isShipped")}
              className={`col-span-2 p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${
                formData.isShipped
                  ? "bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`}
            >
              <Truck
                size={16}
                className={
                  formData.isShipped
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }
              />
              <span className="text-sm font-bold">
                Đã gửi hàng (Xác nhận đi hàng)
              </span>
            </div>
          </div>

          <textarea
            name="note"
            value={formData.note}
            onChange={handleFormChange}
            rows={2}
            placeholder="Ghi chú thêm..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleSubmit}
            disabled={isSaving || items.length === 0 || isLoadingInitial}
            className={`w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all ${
              isSaving || items.length === 0 || isLoadingInitial
                ? "bg-blue-400 dark:bg-blue-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              `Hoàn thành (${items.length})`
            )}
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Thêm sản phẩm mới
              </h2>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setModalProductData({ name: "", price: "", quantity: "1" });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalProductData.name}
                  onChange={(e) =>
                    setModalProductData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Giá và Số lượng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Tag size={14} />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={modalProductData.price}
                      onChange={(e) => {
                        const formatted = formatInputNumber(e.target.value);
                        setModalProductData((prev) => ({
                          ...prev,
                          price: formatted,
                        }));
                      }}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số lượng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={modalProductData.quantity}
                    onChange={(e) =>
                      setModalProductData((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="1"
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>
              </div>

              {/* Tổng tiền preview */}
              {modalProductData.price && modalProductData.quantity && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tổng tiền:
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        parseFloat(modalProductData.price.replace(/\./g, "")) *
                          parseFloat(modalProductData.quantity || "1")
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setModalProductData({ name: "", price: "", quantity: "1" });
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleModalAddProduct}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Tạo sản phẩm mới
              </h2>
              <button
                onClick={() => {
                  setShowCreateProductModal(false);
                  setCreateProductModalData({ name: "", price: "", description: "", sku: "" });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên sản phẩm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createProductModalData.name}
                  onChange={(e) =>
                    setCreateProductModalData((prev) => ({
                      ...prev,
                      name: e.target.value,
                      sku: prev.sku || generateSKU(e.target.value),
                    }))
                  }
                  placeholder="Nhập tên sản phẩm..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createProductModalData.sku}
                  onChange={(e) =>
                    setCreateProductModalData((prev) => ({
                      ...prev,
                      sku: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Mã SKU tự động"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  SKU sẽ được tạo tự động nếu để trống
                </p>
              </div>

              {/* Giá và Danh mục */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Tag size={14} />
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={createProductModalData.price}
                      onChange={(e) => {
                        const formatted = formatInputNumber(e.target.value);
                        setCreateProductModalData((prev) => ({
                          ...prev,
                          price: formatted,
                        }));
                      }}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="">Đang tải danh mục...</option>
                    ) : (
                      <>
                        {!selectedCategoryId && (
                          <option value="">-- Chọn danh mục --</option>
                        )}
                        {categories.map((cat) => {
                          const catId = cat._id || cat.id;
                          return (
                            <option key={catId} value={catId}>
                              {cat.name}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Không có danh mục nào. Vui lòng tạo danh mục trước.
                    </p>
                  )}
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={createProductModalData.description}
                  onChange={(e) =>
                    setCreateProductModalData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Nhập mô tả sản phẩm..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCreateProductModal(false);
                  setCreateProductModalData({ name: "", price: "", description: "", sku: "" });
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateProductFromModal}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Package size={20} />
                Tạo sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
