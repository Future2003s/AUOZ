"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );
  const { sessionToken } = useAppContextProvider();

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

  // Sync cart with server when logged in
  useEffect(() => {
    const sync = async () => {
      if (!sessionToken) return;
      try {
        // Pull server cart
        const res = await fetch(`/api/cart`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
          cache: "no-store",
        });
        if (res.ok) {
          const text = await res.text();
          const payload = text ? JSON.parse(text) : null;
          const serverItems: any[] =
            payload?.data?.items || payload?.items || [];
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            const mapped: CartItem[] = serverItems.map((it: any) => ({
              id: it.id || it.sku || it.productId,
              name: it.name || it.productName,
              price: Number(it.price || it.unitPrice || 0),
              quantity: Number(it.quantity || 1),
              imageUrl: it.imageUrl || it.thumbnail,
              productId: it.productId || it.id,
              variantId: it.variantId ?? null,
              variantName: it.variantName ?? null,
            }));
            setItems(mapped);
            return;
          }
        }
        // If server empty, push local items
        if (items.length > 0) {
          await Promise.all(
            items.map((it) =>
              fetch(`/api/cart`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                  productId: it.productId || it.id,
                  quantity: it.quantity,
                  variantId: it.variantId,
                }),
              })
            )
          );
        }
      } catch {}
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

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
        // push server update if logged in
        if (sessionToken) {
          fetch(`/api/cart`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              itemId: next[idx].id,
              productId: next[idx].productId || next[idx].id,
              variantId: next[idx].variantId,
              quantity: next[idx].quantity,
            }),
          }).catch(() => {});
        }
        return next;
      }
      const next = [...prev, item];
      if (sessionToken) {
        fetch(`/api/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            productId: item.productId || item.id,
            variantId: item.variantId,
            quantity: item.quantity,
          }),
        }).catch(() => {});
      }
      return next;
    });
  };

  const removeItem = (id: string, variantId?: string | null) => {
    setItems((prev) => {
      const next = prev.filter(
        (it) =>
          !(it.id === id && (it.variantId || null) === (variantId || null))
      );
      if (sessionToken) {
        fetch(`/api/cart`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ itemId: id, variantId }),
        }).catch(() => {});
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
      if (sessionToken) {
        const target = next.find(
          (it) => it.id === id && (it.variantId || null) === (variantId || null)
        );
        if (target) {
          fetch(`/api/cart`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({
              itemId: target.id,
              productId: target.productId || target.id,
              variantId: target.variantId,
              quantity: target.quantity,
            }),
          }).catch(() => {});
        }
      }
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    setAppliedVoucher(null);
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
    let payload: any = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        console.error("Failed to parse voucher response", error);
      }
    }

    if (!res.ok) {
      const message =
        payload?.message ||
        payload?.data?.message ||
        "Không thể áp dụng voucher";
      throw new Error(message);
    }

    const data = payload?.data ?? payload;
    const normalized: AppliedVoucher = {
      id: data?.voucher?.id || data?.voucher?._id || trimmed,
      code: data?.voucher?.code || trimmed.toUpperCase(),
      name: data?.voucher?.name || "",
      description: data?.voucher?.description,
      discountType: data?.voucher?.discountType || "fixed",
      discountValue: Number(data?.voucher?.discountValue || 0),
      maxDiscountValue: data?.voucher?.maxDiscountValue,
      minOrderValue: data?.voucher?.minOrderValue,
      status: data?.voucher?.status || data?.runtimeStatus || "active",
      discountAmount: Number(data?.discountAmount || 0),
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
        const payload = text ? JSON.parse(text) : null;
        if (!res.ok) {
          throw new Error(
            payload?.message ||
              payload?.data?.message ||
              "Voucher không còn hợp lệ"
          );
        }
        if (cancelled) return;
        const data = payload?.data ?? payload;
        setAppliedVoucher((prev) =>
          prev
            ? {
                ...prev,
                discountAmount: Number(data?.discountAmount || 0),
                status: data?.voucher?.status || prev.status,
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
  }, [subtotal]);

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
