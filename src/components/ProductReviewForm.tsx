"use client";
import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  author?: string;
  createdAt?: string;
}

interface Props {
  productId: string;
  onReviewSubmitted?: (newAvgRating: number, totalCount: number) => void;
}

export default function ProductReviewForm({ productId, onReviewSubmitted }: Props) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has already reviewed (lazy — checked on first render if auth)
  const checkedRef = useRef(false);
  if (isAuthenticated && !checkedRef.current) {
    checkedRef.current = true;
    fetch(`/api/products/${productId}/reviews/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.hasReviewed || data?.data?.hasReviewed) setHasReviewed(true);
      })
      .catch(() => {});
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Vui lòng chọn số sao đánh giá"); return; }
    if (comment.trim().length < 10) { setError("Nội dung đánh giá phải có ít nhất 10 ký tự"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gửi đánh giá thất bại");
      setSubmitted(true);
      setHasReviewed(true);
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      // Notify parent with updated avg/count
      const newAvg = data?.data?.avgRating ?? data?.avgRating;
      const newCount = data?.data?.reviewCount ?? data?.reviewCount;
      if (newAvg != null && onReviewSubmitted) onReviewSubmitted(newAvg, newCount);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, productId, onReviewSubmitted]);

  if (!isAuthenticated) return null;

  if (hasReviewed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-700 font-medium">Bạn đã đánh giá sản phẩm này. Cảm ơn!</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
        <p className="font-semibold text-green-800">Đánh giá của bạn đã được ghi nhận!</p>
        <p className="text-sm text-green-600">Cảm ơn bạn đã chia sẻ trải nghiệm.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Viết đánh giá</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Điểm đánh giá <span className="text-red-500">*</span></p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125 focus:outline-none"
                aria-label={`${star} sao`}
              >
                <svg
                  className={`h-8 w-8 transition-colors ${star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "fill-current text-gray-200"}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-medium text-amber-600">
                {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Nhận xét <span className="text-red-500">*</span>
            <span className="ml-1 text-gray-400 font-normal">({comment.length}/500)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này (tối thiểu 10 ký tự)..."
            className={`w-full px-4 py-3 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-colors resize-none ${error && comment.length < 10 ? "border-red-400" : "border-gray-200"}`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">⚠️ {error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0 || comment.length < 10}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </form>
    </div>
  );
}
