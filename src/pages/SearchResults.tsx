import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductSection from "../components/ProductSection";
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `${API_BASE}/products?q=${encodeURIComponent(query)}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!res.ok || data.ok === false)
          throw new Error(data.error || "검색 실패");
        if (!alive) return;
        setProducts(data.products as Product[]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "검색 중 에러가 발생했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        검색 중...
      </div>
    );
  }

  if (err) {
    return (
      <div className="container py-10 text-center text-red-600">
        오류: {err}
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="container py-10 text-center text-gray-600">
        검색어를 입력해주세요.
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          &quot;{query}&quot; 검색 결과
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {products.length}개의 상품을 찾았습니다.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <ProductSection title="" products={products} />
      )}
    </div>
  );
}


