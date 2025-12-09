"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircleMore,
  SendHorizonal,
  Camera,
  Star,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

type CommentUser = {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string;
};

type ProductComment = {
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
  replies?: ProductComment[];
  // Optional fields for UI only (not required by backend)
  rating?: number;
  images?: string[];
};

const PAGE_SIZE = 5;

const formatTimeAgo = (value: string) => {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true, locale: vi });
  } catch {
    return new Date(value).toLocaleString("vi-VN");
  }
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

interface CommentApiResponse {
  success?: boolean;
  message?: string;
  data?: ProductComment[] | ProductComment;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProductCommentsSection({ productId }: { productId: string }) {
  const { isAuthenticated, user } = useAuth();

  const [comments, setComments] = useState<ProductComment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "with-replies">("all");
  const [isWritingReview, setIsWritingReview] = useState(false);

  const totalComments = useMemo(
    () => comments.reduce((sum, comment) => sum + 1 + (comment.replyCount || 0), 0),
    [comments]
  );

  const distinctCommenters = useMemo(() => {
    const ids = new Set<string>();
    comments.forEach((comment) => {
      if (comment.user?.id) ids.add(comment.user.id);
    });
    return ids.size;
  }, [comments]);

  // Helpers for UI-only stars (rating not stored in backend)
  const renderStars = (rating: number, size = 16, interactive = false, setRating?: (v: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${interactive ? "cursor-pointer transition-transform hover:scale-110" : ""} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => interactive && setRating && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const parseResponse = (payload: CommentApiResponse | null, fallbackMessage = "Có lỗi xảy ra") => {
    if (!payload) throw new Error(fallbackMessage);
    if (payload.success === false) {
      throw new Error(payload.message || fallbackMessage);
    }
    return payload;
  };

  const fetchComments = useCallback(
    async (pageToLoad = 1) => {
      if (!productId) return;
      setLoading(true);
      setError(null);
      try {
        const url = `/api/comments/product/${productId}?page=${pageToLoad}&limit=${PAGE_SIZE}`;
        const res = await fetch(url, { cache: "no-store", credentials: "include" });
        const text = await res.text();
        const payload = text ? (JSON.parse(text) as CommentApiResponse) : null;
        const parsed = parseResponse(payload, "Không thể tải bình luận");

        const data = Array.isArray(parsed.data) ? parsed.data : [];
        setComments((prev) => (pageToLoad === 1 ? data : [...prev, ...data]));

        if (parsed.pagination) {
          setPage(parsed.pagination.page);
          setHasMore(parsed.pagination.page < parsed.pagination.pages);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Không thể tải bình luận");
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    setPage(1);
    fetchComments(1);
  }, [productId, fetchComments]);

  const canDeleteComment = useCallback(
    (comment: ProductComment) => {
      if (!user) return false;
      const currentUserId = (user as any)?._id || user.id;
      const commentUserId = (comment.user as any)?._id || comment.user?.id;
      const isOwner = commentUserId && currentUserId && commentUserId === currentUserId;
      const isAdmin = ["admin", "seller"].includes(user.role);
      return isOwner || isAdmin;
    },
    [user]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated) {
        toast.error("Vui lòng đăng nhập để xoá bình luận");
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
        parseResponse(payload, "Không thể xoá bình luận");

        setComments((prev) =>
          prev.filter((item) => item.id !== commentId && item.parentCommentId !== commentId)
        );
        toast.success("Đã xoá bình luận");
      } catch (err: any) {
        console.error(err);
        const message =
          err?.message?.includes("403") || err?.message?.includes("authorized")
            ? "Bạn không có quyền xoá bình luận này"
            : err instanceof Error
            ? err.message
            : "Không thể xoá bình luận";
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [isAuthenticated, parseResponse]
  );

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json; charset=utf-8",
      };
      const res = await fetch("/api/comments", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          productId,
          content: content.trim(),
        }),
      });

      const text = await res.text();
      const payload = text ? (JSON.parse(text) as CommentApiResponse) : null;
      const parsed = parseResponse(payload, "Không thể gửi bình luận");

      const newComment = (parsed.data as ProductComment) || null;
      if (!newComment) throw new Error("Phản hồi không hợp lệ từ máy chủ");

      // Backend chưa lưu rating, nên gán vào client state để hiển thị ngay
      setComments((prev) => [{ ...newComment, rating }, ...prev]);
      setContent("");
      setRating(5);
      toast.success("Đã đăng bình luận");
    } catch (err: any) {
      console.error(err);
      const message =
        err?.message?.includes("401") || err?.message?.includes("authorized")
          ? "Vui lòng đăng nhập để bình luận"
          : err instanceof Error
          ? err.message
          : "Không thể gửi bình luận";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [content, productId]);

  // Filtered comments (only simple filters to match available data)
  const filteredComments = comments.filter((comment) => {
    if (filter === "all") return true;
    if (filter === "with-replies") return (comment.replies?.length || comment.replyCount) > 0;
    return true;
  });

  return (
    <div className="mt-12 bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans rounded-3xl border border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá & Bình luận sản phẩm</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Overview (use comments count) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="text-5xl font-extrabold text-yellow-500 mb-2">
                {totalComments > 0 ? "5.0" : "0.0"}
              </div>
              <div className="mb-2">{renderStars(totalComments > 0 ? 5 : 0, 24)}</div>
              <div className="text-gray-600 text-sm font-medium">{totalComments} phản hồi</div>
            </div>

            {/* Right: Stats */}
            <div className="md:col-span-8 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-600 w-12 text-right">Tổng</div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="text-xs text-gray-400 w-14 text-right">{totalComments} bình luận</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-600 w-12 text-right">Người</div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${distinctCommenters === 0 ? 0 : 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 w-14 text-right">{distinctCommenters} người</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter("with-replies")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "with-replies"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              Có phản hồi
            </button>
          </div>

          <button
            onClick={() => setIsWritingReview((v) => !v)}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isWritingReview ? <X size={18} /> : <MessageSquare size={18} />}
            {isWritingReview ? "Đóng" : "Viết bình luận"}
          </button>
        </div>

        {/* Form viết bình luận */}
        {isWritingReview && (
          <div className="p-6 bg-white border-b border-gray-100 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chia sẻ trải nghiệm của bạn</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung bình luận</label>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600">Đánh giá:</span>
                {renderStars(rating, 18, true, setRating)}
                <span className="text-xs text-gray-500">({rating}/5)</span>
              </div>
              <Textarea
                className="w-full min-h-[120px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                placeholder={
                  isAuthenticated
                    ? "Hãy chia sẻ cảm nhận, đánh giá hoặc trải nghiệm của bạn..."
                    : "Đăng nhập để bình luận"
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!isAuthenticated || submitting}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">{content.length}/1000 ký tự</div>
              <div className="flex gap-3">
                {!isAuthenticated && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Đăng nhập để bắt đầu
                  </span>
                )}
                <Button
                  size="sm"
                  className="min-w-[150px] rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={!isAuthenticated || content.trim().length === 0 || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="mr-2 h-4 w-4" />
                      Gửi bình luận
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Danh sách bình luận */}
        <div className="divide-y divide-gray-100 bg-white">
          {filteredComments.length === 0 && !loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                <MessageSquare size={32} className="text-gray-400" />
              </div>
              <p>Chưa có bình luận nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
                        {getInitials(comment.user?.name)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          {comment.user?.name || "Khách hàng"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                          {comment.isEdited && <span className="italic text-gray-400">(đã chỉnh sửa)</span>}
                        {comment.rating ? (
                          <span className="flex items-center gap-1 text-amber-500">
                            {renderStars(comment.rating, 12)}
                          </span>
                        ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full mt-2 sm:mt-0 w-fit">
                        <CheckCircle size={12} />
                        Đã mua hàng
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                      <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <ThumbsUp size={16} />
                        <span>Hữu ích ({comment.likeCount || 0})</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <MessageSquare size={16} />
                        <span>Phản hồi ({comment.replyCount || 0})</span>
                      </button>
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors disabled:opacity-60"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          <span>Xoá</span>
                        </button>
                      )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-white/70 p-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              {reply.user?.avatar && (
                                <AvatarImage src={reply.user.avatar} alt={reply.user?.name || "Người dùng"} />
                              )}
                              <AvatarFallback className="text-xs">{getInitials(reply.user?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-gray-900">
                                  {reply.user?.name || "Người dùng"}
                                </span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                              </div>
                              <p className="mt-1 rounded-lg bg-gray-50/70 p-3 text-sm text-gray-700 shadow-inner">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {comment.replyCount > (comment.replies?.length || 0) && (
                          <p className="text-xs text-gray-500">
                            +{comment.replyCount - (comment.replies?.length || 0)} phản hồi khác
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div className="p-6 text-center border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => fetchComments(page + 1)}
              disabled={loading}
              className="min-w-[180px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Tải thêm bình luận"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

