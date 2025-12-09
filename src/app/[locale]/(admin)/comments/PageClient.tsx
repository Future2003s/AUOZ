"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { productApiRequest, Product } from "@/apiRequests/products";
import { useAppContextProvider } from "@/context/app-context";

type CommentUser = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
  role?: string;
};

type AdminComment = {
  id: string;
  content: string;
  productId: string;
  parentCommentId?: string | null;
  replyCount: number;
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: CommentUser;
};

type CommentApiResponse = {
  success?: boolean;
  message?: string;
  data?: AdminComment[] | AdminComment;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const PAGE_SIZE = 15;

const formatTime = (value: string) => {
  const d = new Date(value);
  return d.toLocaleString("vi-VN");
};

const normalizeUserName = (user?: CommentUser) => {
  if (!user) return "Ẩn danh";
  if (user.name) return user.name;
  if (user.email) return user.email;
  return user.id || user._id || "Ẩn danh";
};

export default function AdminCommentsPage() {
  const { sessionToken } = useAppContextProvider();
  const [searchTerm, setSearchTerm] = useState("");
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(
    async (query: string) => {
      setLoadingProducts(true);
      try {
        const trimmed = query.trim();
        const params = new URLSearchParams({
          page: "1",
          size: "10",
        });
        if (trimmed) {
          params.set("q", trimmed);
        }

        const res = await fetch(`/api/products/admin?${params.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        const normalized = (list || []).map((p: any) => ({
          ...p,
          _id: p._id || p.id,
          id: p._id || p.id,
        }));
        setProductOptions(normalized);
        if (!res.ok) {
          throw new Error(data?.message || "Không thể tìm sản phẩm");
        }
      } catch (error: any) {
        console.error("Search products error:", error);
        toast.error(error?.message || "Không thể tìm sản phẩm");
      } finally {
        setLoadingProducts(false);
      }
    },
    []
  );

  const parseResponse = (payload: CommentApiResponse | null, fallback = "Không thể tải bình luận") => {
    if (!payload) throw new Error(fallback);
    if (payload.success === false) throw new Error(payload.message || fallback);
    return payload;
  };

  const fetchComments = useCallback(
    async (productId: string, pageToLoad = 1) => {
      setCommentLoading(true);
      try {
        const res = await fetch(`/api/comments/product/${productId}?page=${pageToLoad}&limit=${PAGE_SIZE}`, {
          cache: "no-store",
          credentials: "include",
        });
        const text = await res.text();
        const payload = text ? (JSON.parse(text) as CommentApiResponse) : null;
        const parsed = parseResponse(payload);
        const data = Array.isArray(parsed.data) ? parsed.data : [];
        setComments((prev) => (pageToLoad === 1 ? data : [...prev, ...data]));
        if (parsed.pagination) {
          setPage(parsed.pagination.page);
          setHasMore(parsed.pagination.page < parsed.pagination.pages);
        } else {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Không thể tải bình luận");
      } finally {
        setCommentLoading(false);
      }
    },
    []
  );

  const handleSelectProduct = (product: Product) => {
    const normalized = { ...product, _id: product._id || (product as any).id };
    setSelectedProduct(normalized);
    setPage(1);
    setComments([]);
    fetchComments(normalized._id, 1);
  };

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!sessionToken) {
        toast.error("Cần đăng nhập để xoá");
        return;
      }
      setDeletingId(commentId);
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const text = await res.text();
        const payload = text ? (JSON.parse(text) as CommentApiResponse) : null;
        if (!res.ok) {
          const msg = payload?.message || text || `Xoá thất bại (mã ${res.status})`;
          throw new Error(msg);
        }
        parseResponse(payload, "Không thể xoá bình luận");
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentCommentId !== commentId));
        toast.success("Đã xoá bình luận");
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Không thể xoá bình luận");
      } finally {
        setDeletingId(null);
      }
    },
    [sessionToken]
  );

  useEffect(() => {
    loadProducts("");
  }, [loadProducts]);

  const commentCountLabel = useMemo(() => {
    if (!comments.length) return "0 bình luận";
    return `${comments.length} bình luận${hasMore ? " (có thêm)" : ""}`;
  }, [comments.length, hasMore]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý bình luận sản phẩm</h1>
        <p className="text-sm text-gray-600">Tìm sản phẩm và xem xoá bình luận của khách hàng.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Chọn sản phẩm</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="Tìm theo tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={() => loadProducts(searchTerm)} disabled={loadingProducts}>
              {loadingProducts ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span className="ml-1 hidden sm:inline">Tìm</span>
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3">
          {productOptions.length === 0 ? (
            <p className="text-sm text-gray-500">Không có sản phẩm.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {productOptions.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelectProduct(p)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:bg-gray-50 ${
                    selectedProduct?._id === p._id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900 line-clamp-1">{p.name}</div>
                    <div className="text-xs text-gray-500">ID: {p._id}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {p.status || "active"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Bình luận</CardTitle>
            <p className="text-sm text-gray-500">
              {selectedProduct ? `Sản phẩm: ${selectedProduct.name}` : "Chưa chọn sản phẩm"} · {commentCountLabel}
            </p>
          </div>
          {selectedProduct && (
            <Button
              variant="outline"
              onClick={() => fetchComments(selectedProduct._id, 1)}
              disabled={commentLoading}
            >
              {commentLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
              <span className="ml-1 hidden sm:inline">Tải lại</span>
            </Button>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {!selectedProduct ? (
            <div className="p-6 text-sm text-gray-500">Chọn sản phẩm để xem bình luận.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Thích</TableHead>
                    <TableHead>Phản hồi</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{normalizeUserName(c.user)}</span>
                          {c.user?.role && <span className="text-xs text-gray-500">{c.user.role}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xl">
                        <div className="text-sm text-gray-900 line-clamp-3">{c.content}</div>
                        {c.parentCommentId && <div className="text-xs text-gray-500 mt-1">Trả lời bình luận khác</div>}
                      </TableCell>
                      <TableCell>{c.likeCount ?? 0}</TableCell>
                      <TableCell>{c.replyCount ?? 0}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatTime(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {comments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="p-6 text-center text-sm text-gray-500">Chưa có bình luận.</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => selectedProduct && fetchComments(selectedProduct._id, page + 1)}
                    disabled={commentLoading}
                  >
                    {commentLoading ? <Loader2 size={16} className="animate-spin" /> : "Tải thêm"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

