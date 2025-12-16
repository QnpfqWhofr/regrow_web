import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function NewFeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLatest() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/products`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "신규 상품을 불러오지 못했습니다.");
        }
        setProducts(json.products || []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "신규 상품을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLatest();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="p-5 space-y-6 bg-white border rounded-3xl sm:p-7">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">업로드 최신순</p>
            <h1 className="text-2xl font-bold sm:text-3xl">방금 등록된 상품</h1>
          </div>
          {!loading && (
            <div className="text-sm text-gray-500">
              {products.length}개의 상품이 있습니다.
            </div>
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
            아직 등록된 상품이 없습니다.
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

