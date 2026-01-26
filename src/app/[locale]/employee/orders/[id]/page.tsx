 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Truck, Building, ListChecks, UploadCloud } from "lucide-react";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total?: number;
  productId?: string;
};

type DeliveryOrder = {
  _id?: string;
  id?: string;
  orderCode?: string;
  buyerName?: string;
  buyerId?: string;
  deliveryDate?: string;
  createdAt?: string;
  items?: OrderItem[];
  amount?: number;
  status?: string;
  proofImage?: string;
  note?: string;
  isInvoice?: boolean;
  isDebt?: boolean;
  isShipped?: boolean;
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const orderId = params?.id as string;

  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch as regular Order first
        let res = await fetch(`/api/employee/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });
        
        let isDeliveryOrder = false;
        
        // If not found, try as DeliveryOrder
        if (!res.ok || res.status === 404) {
          console.log("[Order Detail] Not found as regular order, trying delivery order...");
          res = await fetch(`/api/delivery/${orderId}`, {
            credentials: "include",
            cache: "no-store",
          });
          isDeliveryOrder = true;
        }
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData?.error || errorData?.message || `HTTP error! status: ${res.status}`;
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        const record = data?.data || data;
        
        // Transform regular Order to match DeliveryOrder structure if needed
        if (!isDeliveryOrder && record) {
          const transformedRecord: DeliveryOrder = {
            _id: record._id || record.id,
            id: record.id || record._id,
            orderCode: record.orderNumber || record.orderCode,
            buyerName: record.user && typeof record.user === "object" 
              ? `${record.user.firstName || ""} ${record.user.lastName || ""}`.trim() || record.user.email || "Khách hàng"
              : record.shippingAddress
              ? `${record.shippingAddress.firstName || ""} ${record.shippingAddress.lastName || ""}`.trim() || "Khách hàng"
              : "Khách hàng",
            deliveryDate: record.deliveredAt || record.deliveryDate,
            createdAt: record.createdAt,
            items: record.items || [],
            amount: record.total,
            status: record.status,
            proofImage: record.proofImage,
            note: record.note,
            isShipped: record.status === "shipped" || record.status === "delivered",
          };
          setOrder(transformedRecord);
          setProofImage(transformedRecord.proofImage || null);
        } else {
          setOrder(record);
          setProofImage(record?.proofImage || null);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    const fetchProofImage = async () => {
      // Skip if we already have a proof image from the order itself
      if (proofImage) return;

      try {
        setProofLoading(true);
        const res = await fetch(`/api/delivery/${orderId}/upload-proof`, {
          cache: "no-store",
        });
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/432e8fdf-0ddd-4690-a25d-aebc1c16d609", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "debug-session",
            runId: "pre-fix-2",
            hypothesisId: "E",
            location: "page.tsx:fetchProofImage:response",
            message: "fetchProofImage response",
            data: {
              url: `/api/delivery/${orderId}/upload-proof`,
              status: res.status,
              ok: res.ok,
              headers: {
                contentType: res.headers.get("content-type"),
              },
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const proofs = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        const firstProof = proofs.find(
          (proof: any) => proof?.proofImage || proof?.proofUrl
        );

        if (firstProof) {
          setProofImage(firstProof.proofImage || firstProof.proofUrl || null);
        }
      } catch (err) {
        console.error("Failed to fetch proof image", err);
      } finally {
        setProofLoading(false);
      }
    };

    if (orderId) {
      fetchProofImage();
    }
  }, [orderId, proofImage]);

  const handleSelectProof = () => {
    fileInputRef.current?.click();
  };

  const uploadProof = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 10MB");
      return;
    }
    try {
      setProofUploading(true);
      setError(null);
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`/api/delivery/${orderId}/upload-proof`, {
        method: "PUT",
        body: form,
      });

      const data = await res.json();
      if (!res.ok || (!data?.success && !data?.data)) {
        const message = data?.message || data?.error || "Không thể tải ảnh chứng từ";
        throw new Error(message);
      }

      const url =
        data?.data?.proofUrl ||
        data?.data?.proofImage ||
        data?.data?.deliveryOrder?.proofImage ||
        data?.proofUrl ||
        data?.proofImage;

      if (url) {
        setProofImage(url);
      }
    } catch (err) {
      console.error("Upload proof error", err);
      setError(err instanceof Error ? err.message : "Không thể tải ảnh chứng từ");
    } finally {
      setProofUploading(false);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input to allow re-select same file
    e.target.value = "";
    uploadProof(file);
  };

  const items = useMemo(() => order?.items || [], [order]);
  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      ),
    [items]
  );

  const deliveryDateObj = order?.deliveryDate
    ? new Date(order.deliveryDate)
    : null;
  const createdAtObj = order?.createdAt ? new Date(order.createdAt) : null;
  const dateDisplay = deliveryDateObj
    ? deliveryDateObj.toLocaleDateString("vi-VN")
    : "--";
  const timeDisplay = createdAtObj
    ? createdAtObj.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Chi tiết đơn hàng
        </h1>
        {order?.status && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <ListChecks size={16} />
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {order.status}
            </span>
          </div>
        )}
      </header>

      <main className="px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang tải đơn hàng...
          </div>
        )}
        {error && (
          <div className="text-red-500 dark:text-red-400 py-4">{error}</div>
        )}
        {!loading && !error && order && (
          <div className="grid gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Mã đơn
                  </div>
                  <div className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {order.orderCode || "--"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Ngày giao
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {dateDisplay}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Giờ tạo
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {timeDisplay}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-blue-500" />
                  <span>{order.buyerName || "Chưa có đơn vị mua hàng"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-green-500" />
                  <span>{order.isShipped ? "Đã giao" : "Chưa giao"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Sản phẩm
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {items.length} dòng
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="text-gray-800 dark:text-gray-100">
                      {item.name}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">
                      {(item.quantity * item.price).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Tổng cộng
                </span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {(order.amount ?? totalAmount).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Ảnh chứng từ
                </h2>
                <button
                  onClick={handleSelectProof}
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  disabled={proofUploading}
                >
                  {proofUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      {proofImage || order?.proofImage ? "Thay ảnh" : "Tải ảnh"}
                    </>
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProofChange}
              />
              {proofImage || order?.proofImage ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={proofImage || order?.proofImage || ""}
                    alt="Proof"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              ) : proofLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải ảnh chứng từ...
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có ảnh chứng từ.
                </div>
              )}
            </div>

            {order.note && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ghi chú
                </h2>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
                  {order.note}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

