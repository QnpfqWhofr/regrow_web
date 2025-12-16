import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  transactionCompleted?: boolean;
  author: {
    id: string;
    userId: string;
    profileImage: string;
  };
};

type ReviewSectionProps = {
  productId: string;
  isSeller?: boolean;
};

export default function ReviewSection({ productId, isSeller = false }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatUsers, setChatUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
    if (isSeller && user) {
      loadChatUsers();
    }
  }, [productId, isSeller, user]);

  const loadChatUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/rooms?productId=${productId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.ok !== false && Array.isArray(data.rooms)) {
        const userIds = new Set<string>(
          data.rooms
            .map((room: any) => room.buyer?.id)
            .filter((id: string | undefined): id is string => !!id)
        );
        setChatUsers(userIds);
      }
    } catch (e) {
      console.error("Failed to load chat users:", e);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/product/${productId}`);
      const data = await res.json();
      if (res.ok && data.ok !== false) {
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "리뷰 작성에 실패했습니다.");
      }

      setReviews((prev) => [data.review, ...prev]);
      setComment("");
      setRating(5);
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || "리뷰 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "리뷰 삭제에 실패했습니다.");
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e: any) {
      alert(e.message || "리뷰 삭제에 실패했습니다.");
    }
  };

  const handleCompleteTransaction = async (reviewId: string) => {
    if (!confirm("거래를 완료하시겠습니까?")) return;

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/complete`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "거래 완료 처리에 실패했습니다.");
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, transactionCompleted: true } : r
        )
      );

      if (data.gameProgress) {
        alert(
          `거래가 완료되었습니다!`
        );
      }
    } catch (e: any) {
      alert(e.message || "거래 완료 처리에 실패했습니다.");
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  const hasUserReview = reviews.some((r) => r.author.id === user?.id);

  return (
    <div className="p-6 space-y-6 bg-white border rounded-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">제품 리뷰</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${
                    star <= Math.round(Number(averageRating))
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-lg font-semibold">{averageRating}</span>
            <span className="text-sm text-gray-500">({reviews.length}개의 리뷰)</span>
          </div>
        </div>
        {user && !hasUserReview && !isSeller && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-semibold text-white bg-black rounded-full hover:opacity-90"
          >
            {showForm ? "취소" : "리뷰 작성"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 border rounded-2xl bg-gray-50">
          <div>
            <label className="block mb-2 text-sm font-medium">평점</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">리뷰 내용</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              rows={4}
              placeholder="제품에 대한 솔직한 리뷰를 남겨주세요."
              required
              maxLength={500}
            />
            <div className="mt-1 text-xs text-right text-gray-500">
              {comment.length}/500
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className={`w-full px-4 py-3 text-sm font-semibold rounded-full ${
              submitting || !comment.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            {submitting ? "작성 중..." : "리뷰 등록"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-10 text-center text-gray-500">리뷰를 불러오는 중...</div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isMyReview = user?.id === review.author.id;
            const hasChatted = chatUsers.has(review.author.id);
            const canComplete = isSeller && hasChatted && !review.transactionCompleted;
            const profileImage = review.author.profileImage
              ? review.author.profileImage.startsWith("http")
                ? review.author.profileImage
                : `${SERVER}${review.author.profileImage}`
              : null;

            return (
              <div key={review.id} className="p-4 border rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-200 rounded-full">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={review.author.userId}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.author.userId}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {review.transactionCompleted && (
                          <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                            거래완료
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      <p className="mt-2 text-sm text-gray-800">{review.comment}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {isMyReview && !review.transactionCompleted && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    )}
                    {canComplete && (
                      <button
                        onClick={() => handleCompleteTransaction(review.id)}
                        className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full hover:bg-green-700"
                      >
                        거래완료
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
