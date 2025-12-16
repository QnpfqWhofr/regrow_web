import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";
const withServer = (src?: string | null) =>
  src ? (src.startsWith("http") ? src : `${SERVER}${src}`) : null;

interface UserInfo {
  id: string;
  userId: string;
  profileImage: string;
  location: string;
  gameTreesGrown: number;
  createdAt: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 사용자 정보 및 상품 목록 로드
  useEffect(() => {
    if (!userId) {
      setErr("사용자 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 사용자 정보 조회
        const userRes = await fetch(`${API_BASE}/auth/user/${userId}`);
        const userData = await userRes.json();
        if (!userRes.ok || userData.ok === false) {
          throw new Error(userData.error || "사용자 정보를 불러올 수 없습니다.");
        }

        // 사용자 상품 목록 조회
        const productsRes = await fetch(`${API_BASE}/products/user/${userId}`);
        const productsData = await productsRes.json();
        if (!productsRes.ok || productsData.ok === false) {
          throw new Error(productsData.error || "상품 목록을 불러올 수 없습니다.");
        }

        if (!alive) return;
        setUser(userData.user);
        setProducts(productsData.products as Product[]);
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
  }, [userId]);

  // 통계 계산
  const stats = {
    total: products.length,
    treesGrown: user?.gameTreesGrown || 0,
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "",
  };

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  if (err || !user) {
    return (
      <div className="container py-10 text-center text-red-600">
        {err || "사용자를 찾을 수 없습니다."}
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
              <div className="flex items-center gap-2 p-3 mt-4 border border-green-200 rounded-lg bg-green-50">
                <span className="text-green-600">🌳</span>
                <div>
                  <div className="text-sm font-medium text-green-700">
                    키운 나무: {stats.treesGrown}그루
                  </div>
                  <div className="text-xs text-green-600">
                    게임에서 성장시킨 나무의 개수입니다
                  </div>
                </div>
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
              <div className="text-2xl font-bold">{stats.treesGrown}</div>
              <div className="mt-1 text-sm text-gray-600">키운 나무</div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm text-gray-600">가입일</div>
              <div className="text-sm font-medium">{stats.joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 상품 목록 제목 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          {user.userId}님의 상품 ({products.length})
        </h3>
      </div>

      {/* 상품 그리드 */}
      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          판매중인 상품이 없습니다.
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
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <h3 className="text-sm line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="mt-1 font-semibold">
                      {Number(product.price).toLocaleString()}원
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{product.location || "지역 정보 없음"}</span>
                      <span>{timeAgo}</span>
                    </div>
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