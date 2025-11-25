"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppContextProvider } from "@/context/app-context";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  productId?: string;
  variantId?: string | null;
  variantName?: string | null;
};

export type AppliedVoucher = {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  status: string;
  discountAmount: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string | null) => void;
  updateQuantity: (
    id: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  clear: () => void;
  totalQuantity: number;
  subtotal: number;
  appliedVoucher: AppliedVoucher | null;
  discountAmount: number;
  grandTotal: number;
  applyVoucher: (code: string) => Promise<AppliedVoucher>;
  removeVoucher: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "app_cart_v1";
const VOUCHER_STORAGE_KEY = "app_cart_v1_voucher";
const SESSION_STORAGE_KEY = "app_cart_session";
const SESSION_HEADER = "X-Session-Id";

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

type JsonRecord = Record<string, unknown>;

type RawCartProduct =
  | {
      _id?: string;
      id?: string;
      name?: string;
      price?: number;
      finalPrice?: number;
      images?: string[];
    }
  | string
  | null;

type RawCartItem = {
  id?: string;
  sku?: string;
  product?: RawCartProduct;
  productId?: string;
  productName?: string;
  name?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  imageUrl?: string;
  images?: string[];
  thumbnail?: string;
  variantId?: string | null;
  variantName?: string | null;
  variant?: Array<{
    name?: string;
    value?: string;
  }>;
};

type CartMutationPayload = {
  productId?: string;
  variantId?: string | null;
  quantity?: number;
  itemId?: string;
  clearAll?: boolean;
};

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRawCartItem = (value: unknown): value is RawCartItem =>
  isJsonRecord(value);

const extractCartItems = (payload: unknown): RawCartItem[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRawCartItem);
  }

  if (!isJsonRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.items)) {
    return payload.items.filter(isRawCartItem);
  }

  const dataField = payload.data;
  if (isJsonRecord(dataField) && Array.isArray(dataField.items)) {
    return dataField.items.filter(isRawCartItem);
  }

  return [];
};

const isProductRecord = (
  product: RawCartProduct
): product is Exclude<RawCartProduct, string | null> =>
  typeof product === "object" && product !== null;

const mapServerItems = (serverItems: RawCartItem[]): CartItem[] => {
  if (!Array.isArray(serverItems)) return [];

  return serverItems.map((item) => {
    const productField = item.product ?? null;
    let resolvedProductId = item.productId || item.id || "";
    let resolvedName = item.name || item.productName || "Sản phẩm";
    let resolvedPrice = item.price ?? item.unitPrice ?? 0;
    let resolvedImages: string[] | undefined;

    if (typeof productField === "string") {
      resolvedProductId = productField || resolvedProductId;
    } else if (isProductRecord(productField)) {
      resolvedProductId =
        productField._id || productField.id || resolvedProductId;
      resolvedName = productField.name || resolvedName;
      resolvedPrice =
        item.price ??
        productField.finalPrice ??
        productField.price ??
        resolvedPrice;
      resolvedImages = productField.images;
    }

    const fallbackImages = resolvedImages || item.images;
    const variantLabel = Array.isArray(item.variant)
      ? item.variant
          .map((entry) =>
            entry &&
            typeof entry.name === "string" &&
            typeof entry.value === "string"
              ? `${entry.name}: ${entry.value}`
              : null
          )
          .filter((label): label is string => Boolean(label))
          .join(" • ") || item.variantName || null
      : item.variantName || null;

    const imageUrl =
      item.imageUrl ||
      item.thumbnail ||
      (Array.isArray(fallbackImages) ? fallbackImages[0] : undefined);

    return {
      id: resolvedProductId || item.id || item.sku || "cart-item",
      productId: resolvedProductId || item.productId || item.id,
      name: resolvedName,
      price: Number(resolvedPrice ?? 0),
      quantity: Number(item.quantity ?? 1),
      imageUrl,
      variantId:
        item.variantId ||
        (Array.isArray(item.variant) ? JSON.stringify(item.variant) : null),
      variantName: variantLabel,
    };
  });
};

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const getString = (source: JsonRecord | null, key: string): string | null => {
  if (!source) return null;
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getNumber = (source: JsonRecord | null, key: string): number | null => {
  if (!source) return null;
  const value = source[key];
  return typeof value === "number" ? value : null;
};

const getRecord = (source: JsonRecord | null, key: string): JsonRecord | null => {
  if (!source) return null;
  const value = source[key];
  return isJsonRecord(value) ? value : null;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );
  const { sessionToken } = useAppContextProvider();
  const [cartSessionId, setCartSessionId] = useState<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  const hasHydratedServerCart = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && raw.trim() !== "") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const voucherRaw = localStorage.getItem(VOUCHER_STORAGE_KEY);
      if (voucherRaw && voucherRaw.trim() !== "") {
        const parsedVoucher = JSON.parse(voucherRaw);
        if (parsedVoucher?.code) {
          setAppliedVoucher(parsedVoucher);
        }
      }
    } catch (error) {
      console.error("Error parsing cart data from localStorage:", error);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VOUCHER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      if (appliedVoucher) {
        localStorage.setItem(
          VOUCHER_STORAGE_KEY,
          JSON.stringify(appliedVoucher)
        );
      } else {
        localStorage.removeItem(VOUCHER_STORAGE_KEY);
      }
    } catch {}
  }, [appliedVoucher]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }
      setCartSessionId(sessionId);
    } catch (error) {
      console.error("Failed to initialize cart session", error);
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    hasHydratedServerCart.current = false;
  }, [cartSessionId]);

  const buildHeaders = useCallback(
    (extra?: Record<string, string>) => {
      const headers: Record<string, string> = {
        ...(extra || {}),
      };
      if (cartSessionId) {
        headers[SESSION_HEADER] = cartSessionId;
      }
      if (sessionToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }
      return headers;
    },
    [cartSessionId, sessionToken]
  );

  const sendCartRequest = useCallback(
    (method: "POST" | "PUT" | "DELETE", payload: CartMutationPayload) => {
      if (!cartSessionId) {
        return Promise.resolve();
      }
      return fetch(`/api/cart`, {
        method,
        headers: buildHeaders({
          "Content-Type": "application/json; charset=utf-8",
        }),
        body: JSON.stringify(payload),
      }).catch(() => {});
    },
    [buildHeaders, cartSessionId]
  );

  const fetchCartFromServer = useCallback(async (): Promise<CartItem[] | null> => {
    if (!cartSessionId) return null;
    try {
      const res = await fetch(`/api/cart`, {
        method: "GET",
        headers: buildHeaders(),
        cache: "no-store",
      });
      if (!res.ok) {
        return null;
      }
      const text = await res.text();
      const payload = text ? safeJsonParse(text) : null;
      const serverItems = extractCartItems(payload);
      return mapServerItems(serverItems);
    } catch (error) {
      console.warn("Failed to hydrate cart from server", error);
      return null;
    }
  }, [buildHeaders, cartSessionId]);

  const pushItemsToServer = useCallback(
    async (itemsToSync: CartItem[]) => {
      if (!cartSessionId || itemsToSync.length === 0) return;
      await Promise.all(
        itemsToSync.map((it) =>
          sendCartRequest("POST", {
            productId: it.productId || it.id,
            variantId: it.variantId,
            quantity: it.quantity,
          })
        )
      );
    },
    [cartSessionId, sendCartRequest]
  );

  useEffect(() => {
    if (!cartSessionId || hasHydratedServerCart.current) return;
    let cancelled = false;

    const hydrate = async () => {
      const serverItems = await fetchCartFromServer();
      if (cancelled) return;

      if (Array.isArray(serverItems) && serverItems.length > 0) {
        setItems(serverItems);
      } else if (itemsRef.current.length > 0) {
        await pushItemsToServer(itemsRef.current);
      }

      hasHydratedServerCart.current = true;
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [cartSessionId, fetchCartFromServer, pushItemsToServer]);

  useEffect(() => {
    if (!sessionToken || !cartSessionId) return;
    let cancelled = false;

    const mergeAndRefresh = async () => {
      try {
        await fetch(`/api/cart/merge`, {
          method: "POST",
          headers: buildHeaders({
            "Content-Type": "application/json; charset=utf-8",
          }),
          body: JSON.stringify({ sessionId: cartSessionId }),
        });
      } catch (error) {
        console.warn("Failed to merge guest cart", error);
      }

      const serverItems = await fetchCartFromServer();
      if (!cancelled && Array.isArray(serverItems) && serverItems.length > 0) {
        setItems(serverItems);
      }
    };

    mergeAndRefresh();

    return () => {
      cancelled = true;
    };
  }, [sessionToken, cartSessionId, buildHeaders, fetchCartFromServer]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) =>
          it.id === item.id &&
          (it.variantId || null) === (item.variantId || null)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + item.quantity,
        };
        sendCartRequest("PUT", {
          itemId: next[idx].id,
          productId: next[idx].productId || next[idx].id,
          variantId: next[idx].variantId,
          quantity: next[idx].quantity,
        });
        return next;
      }
      const next = [...prev, item];
      sendCartRequest("POST", {
        productId: item.productId || item.id,
        variantId: item.variantId,
        quantity: item.quantity,
      });
      return next;
    });
  };

  const removeItem = (id: string, variantId?: string | null) => {
    setItems((prev) => {
      const next = prev.filter(
        (it) =>
          !(it.id === id && (it.variantId || null) === (variantId || null))
      );
      const target = prev.find(
        (it) => it.id === id && (it.variantId || null) === (variantId || null)
      );
      const productId = target?.productId || target?.id || id;
      if (productId) {
        sendCartRequest("DELETE", { productId });
      }
      return next;
    });
  };

  const updateQuantity = (
    id: string,
    quantity: number,
    variantId?: string | null
  ) => {
    setItems((prev) => {
      const next = prev.map((it) =>
        it.id === id && (it.variantId || null) === (variantId || null)
          ? { ...it, quantity: Math.max(1, quantity) }
          : it
      );
      const target = next.find(
        (it) => it.id === id && (it.variantId || null) === (variantId || null)
      );
      if (target) {
        sendCartRequest("PUT", {
          itemId: target.id,
          productId: target.productId || target.id,
          variantId: target.variantId,
          quantity: target.quantity,
        });
      }
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    setAppliedVoucher(null);
    sendCartRequest("DELETE", { clearAll: true });
  };
  const removeVoucher = () => setAppliedVoucher(null);

  const applyVoucher = async (code: string): Promise<AppliedVoucher> => {
    const trimmed = code.trim();
    if (!trimmed) {
      throw new Error("Vui lòng nhập mã voucher hợp lệ");
    }
    const res = await fetch("/api/vouchers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed, subtotal }),
      cache: "no-store",
    });

    const text = await res.text();
    const payload = text ? safeJsonParse(text) : null;
    const baseRecord = isJsonRecord(payload) ? payload : null;
    const nestedData = getRecord(baseRecord, "data");

    if (!res.ok) {
      const message =
        getString(baseRecord, "message") ||
        getString(nestedData, "message") ||
        "Không thể áp dụng voucher";
      throw new Error(message);
    }

    const effectiveData: JsonRecord = nestedData || baseRecord || {};
    const voucherRecord = getRecord(effectiveData, "voucher");
    const discountTypeValue = getString(voucherRecord, "discountType");
    const voucherStatus =
      getString(voucherRecord, "status") ||
      getString(effectiveData, "runtimeStatus") ||
      "active";

    const normalized: AppliedVoucher = {
      id:
        getString(voucherRecord, "id") ||
        getString(voucherRecord, "_id") ||
        trimmed,
      code: getString(voucherRecord, "code") || trimmed.toUpperCase(),
      name: getString(voucherRecord, "name") || "",
      description: getString(voucherRecord, "description") || undefined,
      discountType:
        discountTypeValue === "percentage" ? "percentage" : "fixed",
      discountValue: Number(
        getNumber(voucherRecord, "discountValue") ?? 0
      ),
      maxDiscountValue: getNumber(voucherRecord, "maxDiscountValue") ?? undefined,
      minOrderValue: getNumber(voucherRecord, "minOrderValue") ?? undefined,
      status: voucherStatus,
      discountAmount: Number(
        getNumber(effectiveData, "discountAmount") ?? 0
      ),
    };
    setAppliedVoucher(normalized);
    return normalized;
  };

  const { totalQuantity, subtotal } = useMemo(() => {
    const tq = items.reduce((s, it) => s + it.quantity, 0);
    const tp = items.reduce((s, it) => s + it.quantity * it.price, 0);
    return { totalQuantity: tq, subtotal: tp };
  }, [items]);

  useEffect(() => {
    if (!appliedVoucher) return;
    if (subtotal <= 0) {
      setAppliedVoucher(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const revalidate = async () => {
      try {
        const res = await fetch("/api/vouchers/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedVoucher.code, subtotal }),
          cache: "no-store",
          signal: controller.signal,
        });
        const text = await res.text();
        const payload = text ? safeJsonParse(text) : null;
        const baseRecord = isJsonRecord(payload) ? payload : null;
        const nestedData = getRecord(baseRecord, "data");
        if (!res.ok) {
          throw new Error(
            getString(baseRecord, "message") ||
              getString(nestedData, "message") ||
              "Voucher không còn hợp lệ"
          );
        }
        if (cancelled) return;
        const effectiveData: JsonRecord = nestedData || baseRecord || {};
        const voucherRecord = getRecord(effectiveData, "voucher");
        setAppliedVoucher((prev) =>
          prev
            ? {
                ...prev,
                discountAmount: Number(
                  getNumber(effectiveData, "discountAmount") ?? 0
                ),
                status: getString(voucherRecord, "status") || prev.status,
              }
            : prev
        );
      } catch (error) {
        if (cancelled) return;
        console.warn("Voucher revalidation failed", error);
        setAppliedVoucher(null);
      }
    };

    revalidate();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [appliedVoucher, subtotal]);

  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const grandTotal = Math.max(subtotal - discountAmount, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    totalQuantity,
    subtotal,
    appliedVoucher,
    discountAmount,
    grandTotal,
    applyVoucher,
    removeVoucher,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
