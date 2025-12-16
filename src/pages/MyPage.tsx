import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";
const withServer = (src?: string | null) =>
  src ? (src.startsWith("http") ? src : `${SERVER}${src}`) : null;

export default function MyPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId]?.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // 로그인 체크 및 데이터 로드
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { state: { from: "/mypage" } });
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/products/my`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || data.ok === false)
          throw new Error(data.error || "불러오기 실패");
        if (!alive) return;
        setProducts(data.products as Product[]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "에러가 발생했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, authLoading, navigate]);

  // 통계 계산
  const stats = {
    total: products.length,
    reviews: 1, // 임시값 (거래후기는 추후 구현)
  };

  // 상태 변경
  const updateStatus = async (id: string, status: "selling" | "reserved" | "sold") => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false)
        throw new Error(data.error || "변경 실패");

      // 판매완료로 변경 시 제품이 삭제되었으면 목록에서 제거
      if (status === "sold" && data.deleted) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status } : p))
        );
      }
      setOpenMenuId(null);
    } catch (e: any) {
      alert(e.message || "변경에 실패했습니다.");
    }
  };

  // 삭제
  const deleteProduct = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.ok === false)
        throw new Error(data.error || "삭제 실패");

      setProducts((prev) => prev.filter((p) => p._id !== id));
      setOpenMenuId(null);
    } catch (e: any) {
      alert(e.message || "삭제에 실패했습니다.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="container py-10 text-center text-red-600">
        {err || "로그인이 필요합니다."}
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* 프로필 및 통계 카드 */}
      <div className="grid gap-6 mb-6 lg:grid-cols-2">
        {/* 프로필 카드 */}
        <div className="p-6 card">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-200 rounded-full">
              {user?.profileImage ? (
                <img
                  src={withServer(user.profileImage) ?? "/placeholder.png"}
                  alt="프로필"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.userId}</h2>
              <p className="mt-1 text-sm text-gray-600">{user.location || "대구광역시 수성구 범어동"}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  프로필 사진 변경
                </button>
                <button
                  onClick={() => navigate("/user/edit")}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  사용자 정보 변경
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="p-6 card">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="mt-1 text-sm text-gray-600">등록한 상품</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.reviews}</div>
              <div className="mt-1 text-sm text-gray-600">거래후기</div>
            </div>
          </div>
        </div>
      </div>

      {/* 상품 그리드 */}
      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          등록한 상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => {
            const firstImage = product.images?.[0];
            const imageSrc = firstImage
              ? firstImage.startsWith("http")
                ? firstImage
                : `${SERVER}${firstImage}`
              : "/placeholder.png";
            const isSold = product.status === "sold";
            const timeAgo = product.createdAt
              ? getTimeAgo(new Date(product.createdAt))
              : "";

            return (
              <div key={product._id} className="relative">
                <div
                  className="block transition cursor-pointer card hover:shadow-md"
                  onClick={() => navigate(`/listing/${product._id}`)}
                >
                  {/* 이미지 */}
                  <div className="relative bg-gray-100 aspect-square">
                    <img
                      src={imageSrc}
                      alt={product.title}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                    {isSold && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <span className="px-3 py-1 text-sm font-semibold text-white bg-black rounded bg-opacity-70">
                          판매완료
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="flex-1 text-sm line-clamp-1">
                        {product.title}
                      </h3>
                      {!isSold && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === product._id ? null : product._id
                            );
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="mt-1 font-semibold">
                      {Number(product.price).toLocaleString()}원
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{product.location || "지역 정보 없음"}</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* 드롭다운 메뉴 */}
                {openMenuId === product._id && !isSold && (
                  <div
                    ref={(el) => {
                      menuRefs.current[product._id] = el;
                    }}
                    className="absolute right-0 z-10 w-32 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                    style={{ top: "100%" }}
                  >
                    {product.status === "selling" ? (
                      <button
                        onClick={() => updateStatus(product._id, "sold")}
                        className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg"
                      >
                        판매완료
                      </button>
                    ) : product.status === "reserved" ? (
                      <>
                        <button
                          onClick={() => updateStatus(product._id, "selling")}
                          className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg"
                        >
                          판매중으로 변경
                        </button>
                        <button
                          onClick={() => updateStatus(product._id, "sold")}
                          className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                        >
                          판매완료
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => navigate(`/listing/${product._id}/edit`)}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 last:rounded-b-lg"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 시간 차이 계산 (예: "3시간 전")
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString();
}

