type Product = {
  brand?: string;
  condition?: "상" | "중" | "하";
  tradeMethod?: "비대면" | "대면";
  shippingFee?: "포함" | "미포함";
  shippingCost?: number;
};

type DetailSidebarProps = {
  product?: Product | null;
};

export default function DetailSidebar({ product }: DetailSidebarProps) {
  if (!product) {
    return (
      <aside className="p-4 text-sm text-gray-700 card">
        <div className="py-10 text-center text-gray-500">
          제품 정보를 불러오는 중...
        </div>
      </aside>
    );
  }

  const brand = product.brand || "정보 없음";
  const condition = product.condition || "중";
  const tradeMethod = product.tradeMethod || "비대면";
  const shippingFee = product.shippingFee || "포함";
  const shippingCost = product.shippingCost || 0;

  const tradeMethodText = tradeMethod === "비대면" ? "비대면 (택배)" : "대면 (직거래)";
  const shippingFeeText =
    tradeMethod === "비대면"
      ? shippingFee === "포함"
        ? "배송비 포함"
        : `배송비 별도 (${shippingCost.toLocaleString()}원)`
      : "해당 없음";

  return (
    <aside className="p-4 text-sm text-gray-700 card">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">브랜드</span>
          <span className="font-medium">{brand}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">제품상태</span>
          <span className="font-medium">{condition}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">거래방식</span>
          <span className="font-medium">{tradeMethodText}</span>
        </div>
        {tradeMethod === "비대면" && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">배송비</span>
            <span className="font-medium">{shippingFeeText}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
