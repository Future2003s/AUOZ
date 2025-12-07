import { useState, useEffect, useCallback } from "react";
import {
  translationV2Api,
  TranslationV2Data,
  TranslationV2Response,
} from "../apiRequests/translationsV2";
import { useAuth } from "./useAuth";

export const useTranslationsV2Admin = () => {
  const { token } = useAuth();
  const [translations, setTranslations] = useState<TranslationV2Data[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      locale?: string,
      category?: string,
      search?: string,
      baseKey?: string
    ) => {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await translationV2Api.getPaginated(
          token,
          page,
          limit,
          locale,
          category,
          search,
          baseKey
        );

        if (response.success && response.data) {
          setTranslations(response.data.translations || []);
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
    [token]
  );

  // Create or update translation
  const upsertTranslation = useCallback(
    async (data: {
      key: string;
      value: string;
      category: TranslationV2Data["category"];
      description?: string;
    }): Promise<boolean> => {
      if (!token) return false;

      setLoading(true);
      setError(null);

      try {
        const response = await translationV2Api.upsert(data, token);

        if (response.success) {
          // Refresh translations list
          await fetchTranslations(
            pagination.page,
            pagination.limit
          );
          return true;
        } else {
          setError(response.message || "Failed to save translation");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.page, pagination.limit, fetchTranslations]
  );

  // Bulk import translations
  const bulkImport = useCallback(
    async (
      translations: Array<{
        key: string;
        value: string;
        category: TranslationV2Data["category"];
        description?: string;
      }>
    ): Promise<{ success: number; failed: number; errors: string[] }> => {
      if (!token) {
        return { success: 0, failed: 0, errors: ["No token"] };
      }

      setLoading(true);
      setError(null);

      try {
        const response = await translationV2Api.bulkImport(translations, token);

        if (response.success && response.data) {
          // Refresh translations list
          await fetchTranslations(
            pagination.page,
            pagination.limit
          );
          return response.data;
        } else {
          setError(response.message || "Failed to import translations");
          return { success: 0, failed: 0, errors: [response.message || "Unknown error"] };
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return {
          success: 0,
          failed: 0,
          errors: [err instanceof Error ? err.message : "Unknown error"],
        };
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.page, pagination.limit, fetchTranslations]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchTranslations();
    }
  }, [token, fetchTranslations]);

  return {
    translations,
    loading,
    error,
    pagination,
    fetchTranslations,
    upsertTranslation,
    bulkImport,
    clearError,
  };
};

