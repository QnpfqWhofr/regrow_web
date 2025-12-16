import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import type { Product } from "../data/mockProducts";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function RecommendFeed() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(keyword);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    async function fetchRecommend() {
      setLoading(true);
      setError(null);
      try {
        const qs = keyword ? `?q=${encodeURIComponent(keyword)}` : "";
        const res = await fetch(`${API_BASE}/products/recommend${qs}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "추천 상품을 불러오지 못했습니다.");
        }
        setProducts(json.products || []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "추천 상품을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRecommend();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="p-5 space-y-6 bg-white border rounded-3xl sm:p-7">
        <header className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                최근 좋아요·공유·열람 기반 맞춤 추천
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">추천 상품</h1>
            </div>
            {!loading && (
              <span className="text-sm text-gray-500">
                {products.length}개의 상품을 찾았어요
              </span>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="관심 있는 키워드를 입력해 보세요"
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white rounded-full bg-neutral-900 hover:opacity-90"
              >
                적용
              </button>
              {keyword && (
                <button
                  type="button"
                  onClick={() => setSearchParams({}, { replace: true })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
                >
                  초기화
                </button>
              )}
            </div>
          </form>
          {!user && (
            <p className="text-sm text-gray-500">
              로그인하면 좋아요·공유·열람 이력을 활용한 맞춤 추천을 받을 수 있어요.
            </p>
          )}
        </header>

        {error && (
          <div className="p-3 text-sm text-red-600 border border-red-200 rounded-xl bg-red-50">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-500">불러오는 중...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            조건에 맞는 추천 상품이 없어요. 키워드를 바꿔보거나 다른 제품을 둘러보세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product._id} item={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

