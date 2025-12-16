// client/src/pages/ListingDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ImageCarousel from "../components/ImageCarousel";
import DetailSidebar from "../components/DetailSidebar";
import ProductSection from "../components/ProductSection";
import ReviewSection from "../components/ReviewSection";
// ✅ mockProducts 대신 타입만 재사용
import type { Product } from "../data/mockProducts";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sellerChatInfo, setSellerChatInfo] = useState<{
    roomId: string;
    buyerId?: string;
  } | null>(null);
  const [checkingSellerChat, setCheckingSellerChat] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "success" | "error">("idle");
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!id) return;
      setLoading(true);
      setErr(null);
      try {
        // 단건 조회
        const pRes = await fetch(`${API_BASE}/products/${id}`, {
          credentials: "include",
        });
        const pJson = await pRes.json();
        if (!pRes.ok || pJson.ok === false)
          throw new Error(pJson.error || "not_found");
        const item: Product = pJson.product;

        // 비슷한 상품 (간단히: 전체 목록에서 현재 id 제외 후 상위 6개)
        const lRes = await fetch(`${API_BASE}/products`, {
          credentials: "include",
        });
        const lJson = await lRes.json();
        const list: Product[] =
          lRes.ok && lJson.ok !== false ? lJson.products : [];

        if (!alive) return;
        setProduct(item);
        setSimilar(list.filter((p) => p._id !== item._id).slice(0, 6));
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "에러가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product || !user || String(product.seller) !== user.id) {
      setSellerChatInfo(null);
      return;
    }

    let alive = true;
    setCheckingSellerChat(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/chat/rooms?productId=${product._id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!alive) return;
        if (res.ok && data.ok !== false && Array.isArray(data.rooms) && data.rooms.length > 0) {
          const firstRoom = data.rooms[0];
          setSellerChatInfo({
            roomId: firstRoom.id,
            buyerId: firstRoom.buyer?.id,
          });
        } else {
          setSellerChatInfo(null);
        }
      } catch {
        if (!alive) return;
        setSellerChatInfo(null);
      } finally {
        if (alive) setCheckingSellerChat(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [product, user]);

  useEffect(() => {
    if (!product) return;
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/listing/${product._id}`);
  }, [product?._id]);

  if (loading) {
    return (
      <div className="container py-10 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  if (err || !product) {
    return (
      <div className="container py-10 text-center text-gray-600">
        {err ? `오류: ${err}` : "존재하지 않는 상품입니다."}
      </div>
    );
  }

  const normalizeImage = (img: string) =>
    img.startsWith("http") ? img : `${SERVER}${img}`;
  const images = product.images?.length
    ? product.images.map((img) => normalizeImage(img))
    : ["/placeholder.png"];
  const isSeller = Boolean(user && product.seller && String(product.seller) === user.id);

  const handleLike = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/products/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.ok === false)
        throw new Error(data.error || "좋아요 실패");

      // 상태 업데이트
      setProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isLiked: data.isLiked,
          likeCount: data.likeCount ?? prev.likeCount ?? 0,
        };
      });
    } catch (e: any) {
      alert(e.message || "좋아요 처리에 실패했습니다.");
    }
  };

  const openShareModal = () => {
    if (!product) return;
    setShareStatus("idle");
    setShareMessage(null);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setShareStatus("idle");
    setShareMessage(null);
    setShareBusy(false);
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    return new Promise<void>((resolve, reject) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          resolve();
        } else {
          reject(new Error("복사 권한을 사용할 수 없습니다."));
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error("복사에 실패했습니다."));
      }
    });
  };

  const handleCopyShare = async () => {
    if (!product || !shareUrl) return;
    setShareBusy(true);
    setShareStatus("idle");
    setShareMessage(null);
    try {
      await copyTextToClipboard(shareUrl);
      const res = await fetch(`${API_BASE}/products/${product._id}/share`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "공유 정보를 저장하지 못했습니다.");
      }
      setProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shareCount: data.shareCount ?? prev.shareCount ?? 0,
        };
      });
      setShareStatus("success");
      setShareMessage("링크가 복사됐어요!");
    } catch (e: any) {
      setShareStatus("error");
      setShareMessage(e?.message || "복사에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setShareBusy(false);
    }
  };

  const goChat = () => {
    if (!product) return;
    if (!user) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        navigate("/login", { state: { from: `/listing/${product._id}` } });
      }
      return;
    }

    const state: Record<string, unknown> = { product };
    if (isSeller && sellerChatInfo?.buyerId) {
      state.buyerId = sellerChatInfo.buyerId;
      state.roomId = sellerChatInfo.roomId;
    }
    navigate(`/chat/${product._id}`, { state });
  };

  const sellerHasChat = Boolean(isSeller && sellerChatInfo);
  const chatDisabled = !user || (isSeller && !sellerHasChat);
  const chatButtonLabel = isSeller
    ? sellerHasChat
      ? "채팅 열기"
      : "채팅대기 중"
    : "채팅하기";

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px]"
      >
        {/* 이미지 */}
        <div className="overflow-hidden bg-white border rounded-3xl">
        <ImageCarousel images={images} />
        </div>

        {/* 본문 */}
        <section className="flex flex-col p-5 space-y-5 bg-white border rounded-3xl sm:p-7">
          {/* 판매자(간단 표기) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => {
              if (product.sellerUserId) {
                navigate(`/user/${product.sellerUserId}`);
              }
            }}
          >
              <div className="overflow-hidden bg-gray-200 rounded-full size-12 sm:size-14">
                {product.sellerProfileImage ? (
                  <img
                    src={normalizeImage(product.sellerProfileImage)}
                    alt="판매자 프로필"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-600" />
                )}
              </div>
            <div>
                <div className="text-base font-semibold sm:text-lg hover:text-green-600 transition-colors">
                  {product.sellerUserId
                    ? `${product.sellerUserId}`
                    : `${product.seller?.slice?.(0, 6) ?? "알수없음"}`}
                </div>
                <div className="text-xs text-gray-500 sm:text-sm">
                {product.location || "지역 정보 없음"}
              </div>
            </div>
            </div>
            {isSeller && (
              <div className="self-start px-4 py-2 text-xs font-semibold text-green-800 bg-green-100 rounded-full sm:text-sm">
                내 상품
              </div>
            )}
          </div>

          {/* 제목/가격 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold sm:text-3xl">{product.title}</h1>
            <div className="text-2xl font-extrabold sm:text-3xl">
              {Number(product.price).toLocaleString()}원
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>
              {product.location || "지역 정보 없음"} ·{" "}
              {product.createdAt
                ? new Date(product.createdAt).toLocaleDateString()
                : ""}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                ❤️ {product.likeCount ?? 0}
              </span>
              <span className="flex items-center gap-1 text-blue-500">
                🔗 {product.shareCount ?? 0}
              </span>
            </div>
          </div>

          {/* 설명 */}
          <div className="p-4 text-sm leading-6 text-gray-800 whitespace-pre-line bg-neutral-50 rounded-2xl sm:text-base">
            {product.description?.trim()
              ? product.description
              : "판매자가 설명을 입력하지 않았습니다."}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`px-4 py-2 text-sm border rounded-full transition ${
                  product.isLiked
                    ? "text-red-500 border-red-500 bg-red-50"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                disabled={!user}
                title={!user ? "로그인이 필요합니다" : ""}
              >
                {product.isLiked ? "❤️ 좋아요" : "♡ 좋아요"}
            </button>
              <button
                type="button"
                onClick={openShareModal}
                className="px-4 py-2 text-sm text-gray-600 border rounded-full hover:bg-gray-100"
              >
              ↗ 공유
            </button>
            </div>
            <button
              className={`w-full h-12 text-sm font-semibold rounded-full sm:w-auto sm:px-10 ${
                chatDisabled
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
              onClick={goChat}
              disabled={chatDisabled}
              title={
                !user
                  ? "로그인이 필요합니다"
                  : isSeller && !sellerHasChat
                    ? checkingSellerChat
                      ? "새 채팅 여부를 확인 중입니다"
                      : "구매자 문의가 오면 채팅을 열 수 있어요"
                    : undefined
              }
            >
              {chatButtonLabel}
            </button>
          </div>
        </section>

        {/* 사이드바 */}
        <div className="hidden w-full h-full lg:block xl:col-auto">
        <DetailSidebar product={product as any} />
        </div>
      </div>

      {/* 리뷰 섹션 */}
      <div className="mt-10">
        <ReviewSection productId={id!} isSeller={isSeller} />
      </div>

      {/* 비슷한 상품 */}
      <div className="mt-10 bg-white border rounded-3xl">
        <ProductSection title="비슷한 상품" products={similar} />
      </div>
    </div>

      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40"
          onClick={closeShareModal}
        >
          <div
            className="w-full max-w-md p-6 space-y-4 bg-white shadow-xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">상품 공유하기</h2>
                <p className="mt-1 text-sm text-gray-500">
                  아래 URL을 복사하여 친구에게 공유해보세요.
                </p>
              </div>
              <button
                type="button"
                onClick={closeShareModal}
                className="text-gray-500 transition hover:text-gray-800"
                aria-label="Close share modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 px-3 py-2 text-sm border rounded-xl bg-gray-50"
                  value={shareUrl || ""}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  onClick={handleCopyShare}
                  disabled={shareBusy}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border ${
                    shareBusy
                      ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                      : "text-white bg-black border-black hover:opacity-90"
                  }`}
                >
                  {shareBusy ? "복사 중..." : "URL 복사"}
                </button>
              </div>
              {shareStatus !== "idle" && shareMessage && (
                <p
                  className={`text-sm ${
                    shareStatus === "success" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {shareMessage}
                </p>
              )}
            </div>

            {product && (
              <div className="text-sm text-gray-500">
                
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeShareModal}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-full hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
