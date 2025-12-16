import ProductCard from "./ProductCard";
import type { Product } from "../data/mockProducts";

interface Props {
  title: string;
  products: Product[];
}

export default function ProductSection({ title, products }: Props) {
  if (!products?.length) return null;

  return (
    <section className="px-4 my-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-2 mb-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((p) => (
          <ProductCard key={p._id} item={p} />
        ))}
      </div>
    </section>
  );
}
