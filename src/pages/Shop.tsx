import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

interface ShopItem {
  id: "waterCan" | "fertilizer" | "growthBooster";
  name: string;
  description: string;
  price: number;
  icon: string;
  effect: string;
}

const shopItems: ShopItem[] = [
  {
    id: "waterCan",
    name: "물뿌리개",
    description: "나무에 물을 주어 성장을 도와줍니다",
    price: 25,
    icon: "💧",
    effect: "성장 +15"
  },
  {
    id: "fertilizer", 
    name: "비료",
    description: "영양분을 공급하여 빠른 성장을 촉진합니다",
    price: 50,
    icon: "🌱",
    effect: "성장 +30"
  },
  {
    id: "growthBooster",
    name: "성장촉진제",
    description: "특수 성분으로 급속한 성장을 유도합니다",
    price: 100,
    icon: "⚡",
    effect: "성장 +50"
  }
];

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coins, waterCans, fertilizers, growthBoosters } = useGame();
  const [buying, setBuying] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({
    waterCan: 1,
    fertilizer: 1,
    growthBooster: 1,
  });

  const getItemCount = (itemId: string) => {
    switch (itemId) {
      case "waterCan": return waterCans;
      case "fertilizer": return fertilizers;
      case "growthBooster": return growthBoosters;
      default: return 0;
    }
  };

  const buyItem = async (item: ShopItem) => {
    if (!user) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        navigate("/login", { state: { from: "/shop" } });
      }
      return;
    }

    const quantity = quantities[item.id];
    const totalCost = item.price * quantity;

    if (coins < totalCost) {
      alert("코인이 부족합니다!");
      return;
    }

    setBuying(item.id);

    try {
      const res = await fetch(`${API_BASE}/auth/shop/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          item: item.id,
          quantity: quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "구매에 실패했습니다.");
      }

      // 게임 상태 새로고침을 위해 페이지 리로드 (또는 GameContext 업데이트)
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "구매 중 오류가 발생했습니다.");
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="container py-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏪 게임 상점</h1>
            <p className="mt-2 text-gray-600">나무 성장에 필요한 아이템을 구매하세요</p>
          </div>
          <button
            onClick={() => navigate("/game")}
            className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 게임으로 돌아가기
          </button>
        </div>
      </div>

      {/* 보유 코인 및 아이템 현황 */}
      <div className="grid gap-4 mb-8 md:grid-cols-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-sm text-yellow-700">보유 코인</div>
              <div className="text-xl font-bold text-yellow-800">{coins.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <div className="text-sm text-blue-700">물뿌리개</div>
              <div className="text-xl font-bold text-blue-800">{waterCans}개</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <div className="text-sm text-green-700">비료</div>
              <div className="text-xl font-bold text-green-800">{fertilizers}개</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-sm text-purple-700">성장촉진제</div>
              <div className="text-xl font-bold text-purple-800">{growthBoosters}개</div>
            </div>
          </div>
        </div>
      </div>

      {/* 상점 아이템 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shopItems.map((item) => {
          const quantity = quantities[item.id];
          const totalCost = item.price * quantity;
          const canAfford = coins >= totalCost;
          const isBuying = buying === item.id;

          return (
            <div key={item.id} className="p-6 transition-shadow border border-gray-200 rounded-lg hover:shadow-md">
              <div className="text-center">
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                
                <div className="mb-4">
                  <div className="text-lg font-semibold text-emerald-600">{item.effect}</div>
                  <div className="text-sm text-gray-500">보유: {getItemCount(item.id)}개</div>
                </div>

                {/* 수량 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구매 수량
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setQuantities(prev => ({ 
                        ...prev, 
                        [item.id]: Math.max(1, prev[item.id] - 1) 
                      }))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantities(prev => ({ 
                        ...prev, 
                        [item.id]: Math.min(10, prev[item.id] + 1) 
                      }))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 가격 및 구매 버튼 */}
                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-900">
                    {totalCost.toLocaleString()} 코인
                  </div>
                  <div className="text-xs text-gray-500">
                    개당 {item.price} 코인
                  </div>
                </div>

                <button
                  onClick={() => buyItem(item)}
                  disabled={!canAfford || isBuying || !user}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                    canAfford && user && !isBuying
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isBuying ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      구매 중...
                    </div>
                  ) : !user ? (
                    "로그인 필요"
                  ) : !canAfford ? (
                    "코인 부족"
                  ) : (
                    `${quantity}개 구매하기`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 안내 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">💡 아이템 사용법</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 게임 페이지에서 아이템을 사용하여 나무를 성장시킬 수 있습니다</li>
          <li>• 아이템은 사용할 때마다 1개씩 소모됩니다</li>
          <li>• 성장촉진제는 가장 효과적이지만 가격이 비쌉니다</li>
          <li>• 코인은 레벨업과 나무 완성 시 획득할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}