"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageCircleMore, SendHorizonal } from "lucide-react";
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
  const { isAuthenticated } = useAuth();

  const [comments, setComments] = useState<ProductComment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        const res = await fetch(url, { cache: "no-store" });
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

      setComments((prev) => [newComment, ...prev]);
      setContent("");
      toast.success("Đã đăng bình luận");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Không thể gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  }, [content, productId]);

  return (
    <section className="mt-12 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-white to-rose-50/60 p-6 shadow-lg shadow-rose-100/60 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 dark:border-gray-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
              <MessageCircleMore className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-rose-500">
                Bình luận sản phẩm
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chia sẻ cảm nhận của bạn về sản phẩm
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalComments > 0
                  ? `${totalComments} phản hồi từ khách hàng · ${distinctCommenters} người tham gia`
                  : "Câu chuyện của bạn giúp chúng tôi cải thiện sản phẩm mỗi ngày."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="rounded-2xl border border-rose-100 bg-white px-4 py-2 text-center text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
              <p className="text-xs uppercase tracking-wide text-rose-500 dark:text-rose-300">Đánh giá</p>
              <p className="font-semibold">{totalComments || 0}+ bình luận</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-white px-4 py-2 text-center text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
              <p className="text-xs uppercase tracking-wide text-rose-500 dark:text-rose-300">Tham gia</p>
              <p className="font-semibold">{distinctCommenters || 0} khách hàng</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isAuthenticated ? "Chia sẻ cảm nhận, đánh giá hoặc trải nghiệm của bạn..." : "Đăng nhập để bình luận"}
            disabled={!isAuthenticated || submitting}
            className="min-h-[140px] resize-none border-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 dark:text-gray-100"
          />
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-300">{content.length}/1000 ký tự</span>
            <div className="flex flex-wrap gap-3">
              {!isAuthenticated && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                  Đăng nhập để bắt đầu
                </span>
              )}
              <Button
                size="sm"
                className="min-w-[150px] rounded-full bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600"
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

        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-800 shadow-inner dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          <p className="text-sm font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-200">
            Gợi ý ghi nhận
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            <li>• Chia sẻ cảm nhận sau khi sử dụng thực tế</li>
            <li>• Đính kèm trải nghiệm nổi bật (độ bền, chất liệu, tính năng)</li>
            <li>• Góp ý để chúng tôi cải thiện dịch vụ tốt hơn</li>
          </ul>
          <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs text-rose-500 shadow-sm dark:bg-gray-900/60 dark:text-rose-100">
            Mọi phản hồi sẽ được kiểm duyệt nhanh để đảm bảo môi trường tích cực và hữu ích.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {comments.length === 0 && !loading ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </div>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="group rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  {comment.user?.avatar && <AvatarImage src={comment.user.avatar} alt={comment.user.name} />}
                  <AvatarFallback>{getInitials(comment.user?.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{comment.user?.name || "Khách hàng"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comment.createdAt)}
                    {comment.isEdited && <span className="ml-2 italic text-gray-400">(đã chỉnh sửa)</span>}
                  </p>
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-gray-50/70 p-4 text-gray-800 shadow-inner dark:bg-gray-800/60 dark:text-gray-100">
                {comment.content}
              </p>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-800/60">
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
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {reply.user?.name || "Người dùng"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 rounded-lg bg-gray-50/70 p-3 text-sm text-gray-700 shadow-inner dark:bg-gray-900/40 dark:text-gray-200">
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
            </article>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
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
    </section>
  );
}

