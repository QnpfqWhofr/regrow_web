import { Link } from "react-router-dom";
import type { Product } from "../data/mockProducts";

const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";


interface Props {
  item: Product;
}

export default function ProductCard({ item }: Props) {
  
  
  // const imageSrc = item.images?.[0] || "/placeholder.png";
  const rawImage = item.images?.[0];
  const imageSrc = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${SERVER}${rawImage}`
    : "/placeholder.png";

  const dateText = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString()
    : "";

  return (
    <Link
      to={`/listing/${item._id}`}
      className="flex flex-col overflow-hidden transition bg-white border rounded-2xl hover:shadow-lg"
    >
      <div
        className="relative w-full overflow-hidden bg-gray-100"
        style={{ paddingTop: "100%" }}
      >
        <img
          src={imageSrc}
          alt={item.title}
          className="absolute inset-0 object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col flex-1 p-3 gap-y-1">
        <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
        <p className="text-base font-semibold sm:text-lg">
          {Number(item.price).toLocaleString()}원
        </p>
        <div className="flex flex-col justify-between text-xs text-gray-500 gap-y-1 sm:flex-row sm:items-center">
          <span className="truncate">{item.location || "지역 정보 없음"}</span>
          <span className="sm:text-right">{dateText}</span>
        </div>
      </div>
    </Link>
  );
}
