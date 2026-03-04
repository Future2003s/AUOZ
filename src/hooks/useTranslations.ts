import { useState, useEffect, useCallback } from "react";
import {
  translationApi,
  TranslationData,
  TranslationStats,
} from "../apiRequests/translations";
import { useAuth } from "./useAuth";

export const useTranslations = () => {
  // Token is httpOnly — use isAuthenticated as guard, actual auth goes through cookies
  const { isAuthenticated } = useAuth();
  const [translations, setTranslations] = useState<TranslationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch paginated translations
  const fetchTranslations = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      category?: string,
      search?: string,
      isActive?: boolean
    ) => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.getPaginated(
          "", // token in httpOnly cookie
          page,
          limit,
          category,
          search,
          isActive
        );

        if (response.success && response.data) {
          setTranslations(response.data.data || []);
          setPagination(
            response.data.pagination || {
              page,
              limit,
              total: 0,
              totalPages: 0,
            }
          );
        } else {
          setError(response.message || "Failed to fetch translations");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Fetch translation statistics
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await translationApi.getStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || "Failed to fetch statistics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create translation
  const createTranslation = useCallback(
    async (data: TranslationData): Promise<boolean> => {
      if (!isAuthenticated) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.create(data, ""); // token in httpOnly cookie

        if (response.success) {
          await fetchTranslations(pagination.page, pagination.limit);
          return true;
        } else {
          setError(response.message || "Failed to create translation");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit, fetchTranslations]
  );

  // Update translation
  const updateTranslation = useCallback(
    async (key: string, data: Partial<TranslationData>): Promise<boolean> => {
      if (!isAuthenticated) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.update(key, data, ""); // token in httpOnly cookie

        if (response.success) {
          await fetchTranslations(pagination.page, pagination.limit);
          return true;
        } else {
          setError(response.message || "Failed to update translation");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit, fetchTranslations]
  );

  // Delete translation
  const deleteTranslation = useCallback(
    async (key: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.delete(key, ""); // token in httpOnly cookie

        if (response.success) {
          await fetchTranslations(pagination.page, pagination.limit);
          return true;
        } else {
          setError(response.message || "Failed to delete translation");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit, fetchTranslations]
  );

  // Bulk import translations
  const bulkImport = useCallback(
    async (translations: TranslationData[]): Promise<boolean> => {
      if (!isAuthenticated) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.bulkImport(translations, ""); // token in httpOnly cookie

        if (response.success) {
          await fetchTranslations(pagination.page, pagination.limit);
          return true;
        } else {
          setError(response.message || "Failed to import translations");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, pagination.page, pagination.limit, fetchTranslations]
  );

  // Search translations
  const searchTranslations = useCallback(
    async (query: string, language?: string, category?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await translationApi.search(query, language, category);

        if (response.success && response.data) {
          setTranslations(response.data.results || []);
          setPagination({
            page: 1,
            limit: 20,
            total: response.data.count || 0,
            totalPages: Math.ceil((response.data.count || 0) / 20),
          });
        } else {
          setError(response.message || "Search failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Export translations
  const exportTranslations = useCallback(
    async (category?: string, language?: string) => {
      try {
        const response = await translationApi.export(category, language);

        if (response.success && response.data) {
          const dataStr = JSON.stringify(response.data.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `translations_${category || "all"}_${language || "all"
            }.json`;
          link.click();
          URL.revokeObjectURL(url);
          return true;
        } else {
          setError(response.message || "Export failed");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchTranslations();
      fetchStats();
    }
  }, [isAuthenticated, fetchTranslations, fetchStats]);

  return {
    translations,
    loading,
    error,
    stats,
    pagination,
    fetchTranslations,
    fetchStats,
    createTranslation,
    updateTranslation,
    deleteTranslation,
    bulkImport,
    searchTranslations,
    exportTranslations,
    clearError,
  };
};
