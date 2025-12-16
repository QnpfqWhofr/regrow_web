import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

const CATEGORY_LIST = [
  "디지털/가전",
  "가구/인테리어",
  "생활/주방",
  "유아동",
  "패션/잡화",
  "도서/음반/문구",
  "스포츠/레저",
  "반려동물용품",
  "티켓/서비스",
  "기타",
];

function normalizeCategory(input: string | null) {
  if (input && CATEGORY_LIST.includes(input)) return input;
  return CATEGORY_LIST[0];
}

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => normalizeCategory(searchParams.get("category")),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchCategoryItems() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/products`, window.location.origin);
        url.searchParams.set("category", selectedCategory);
        const res = await fetch(url.toString(), { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "상품을 불러오지 못했습니다.");
        }
        setProducts(data.products || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "상품을 불러오지 못했습니다.");
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCategoryItems();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleSelect = (category: string) => {
    setSearchParams(category === CATEGORY_LIST[0] ? {} : { category });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="p-4 bg-white border rounded-2xl">
          <h2 className="text-lg font-semibold">카테고리</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {CATEGORY_LIST.map((cat) => {
              const isActive = cat === selectedCategory;
              return (
                <li key={cat}>
                  <button
                    onClick={() => handleSelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-gray-600 hover:bg-neutral-100"
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="p-4 space-y-4 bg-white border rounded-3xl sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">카테고리</p>
              <h1 className="text-2xl font-bold">{selectedCategory}</h1>
            </div>
            <div className="text-sm text-gray-500">
              {loading
                ? "불러오는 중..."
                : `${products.length}개의 상품이 있습니다.`}
            </div>
          </div>

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
        </section>
      </div>
    </div>
  );
}

