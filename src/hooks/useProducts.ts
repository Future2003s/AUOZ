import { useState, useCallback, useEffect } from "react";
import {
  productApiRequest,
  Product,
  ProductsResponse,
  ProductQueryParams,
} from "@/apiRequests/products";

// Product state interface
interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

// Product actions interface
interface ProductActions {
  getProducts: (
    filters?: ProductQueryParams
  ) => Promise<void>;
  getProductById: (productId: string) => Promise<void>;
  getFeaturedProducts: () => Promise<void>;
  searchProducts: (
    query: string,
    filters?: Partial<ProductQueryParams>
  ) => Promise<void>;
  getProductsByCategory: (
    categoryId: string,
    filters?: ProductQueryParams
  ) => Promise<void>;
  getProductsByBrand: (
    brand: string,
    filters?: ProductQueryParams
  ) => Promise<void>;
  clearError: () => void;
  clearProducts: () => void;
}

// Combined product hook return type
type UseProductsReturn = ProductState & ProductActions;

export const useProducts = (): UseProductsReturn => {
  // State management
  const [productState, setProductState] = useState<ProductState>({
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null,
    pagination: null,
  });

  // Clear error
  const clearError = useCallback(() => {
    setProductState((prev) => ({ ...prev, error: null }));
  }, []);

  // Clear products
  const clearProducts = useCallback(() => {
    setProductState((prev) => ({
      ...prev,
      products: [],
      currentProduct: null,
      pagination: null,
    }));
  }, []);

  // Generic function to handle API calls
  const handleApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      updateState: (data: T) => Partial<ProductState>
    ) => {
      try {
        setProductState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await apiCall();

        setProductState((prev) => ({
          ...prev,
          ...updateState(response),
          isLoading: false,
          error: null,
        }));
      } catch (error: any) {
        const errorMessage = error?.message || "API request failed";

        setProductState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    []
  );

  // Get all products with filters and pagination
  const getProducts = useCallback(
    async (filters?: ProductQueryParams) => {
      await handleApiCall(
        () => productApiRequest.getProducts(filters),
        (response: ProductsResponse) => ({
          products: response.data,
          pagination: response.pagination || null,
        })
      );
    },
    [handleApiCall]
  );

  // Get product by ID
  const getProductById = useCallback(
    async (productId: string) => {
      await handleApiCall(
        () => productApiRequest.getProduct(productId),
        (response: any) => ({
          currentProduct: response.data,
        })
      );
    },
    [handleApiCall]
  );

  // Get featured products
  const getFeaturedProducts = useCallback(
    async () => {
      await handleApiCall(
        () => productApiRequest.getFeaturedProducts(),
        (response: ProductsResponse) => ({
          products: response.data,
          pagination: response.pagination || null,
        })
      );
    },
    [handleApiCall]
  );

  // Search products
  const searchProducts = useCallback(
    async (
      query: string,
      filters?: Partial<ProductQueryParams>
    ) => {
      await handleApiCall(
        () => productApiRequest.searchProducts(query, filters),
        (response: ProductsResponse) => ({
          products: response.data,
          pagination: response.pagination || null,
        })
      );
    },
    [handleApiCall]
  );

  // Get products by category
  const getProductsByCategory = useCallback(
    async (
      categoryId: string,
      filters?: ProductQueryParams
    ) => {
      await handleApiCall(
        () =>
          productApiRequest.getProductsByCategory(
            categoryId,
            filters
          ),
        (response: ProductsResponse) => ({
          products: response.data,
          pagination: response.pagination || null,
        })
      );
    },
    [handleApiCall]
  );

  // Get products by brand
  const getProductsByBrand = useCallback(
    async (brand: string, filters?: ProductQueryParams) => {
      await handleApiCall(
        () => productApiRequest.getProductsByBrand(brand, filters),
        (response: ProductsResponse) => ({
          products: response.data,
          pagination: response.pagination || null,
        })
      );
    },
    [handleApiCall]
  );

  return {
    ...productState,
    getProducts,
    getProductById,
    getFeaturedProducts,
    searchProducts,
    getProductsByCategory,
    getProductsByBrand,
    clearError,
    clearProducts,
  };
};
