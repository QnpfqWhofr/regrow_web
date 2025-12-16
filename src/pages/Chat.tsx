import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Product } from "../data/mockProducts";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";

// 안전한 JSON 파싱 헬퍼 함수
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON 파싱 실패:", text);
    throw new Error("서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.");
  }
}

type ChatUser = {
  id: string;
  userId?: string;
  profileImage?: string;
};

type ChatMessage = {
  id: string;
  text: string;
  createdAt: number;
  author?: ChatUser | null;
  isMine?: boolean;
};

type ChatRoom = {
  id: string;
  product?: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    seller: string;
    location?: string;
  };
  buyer?: ChatUser | null;
  seller?: ChatUser | null;
  messages: ChatMessage[];
};

export default function ChatPage() {
  const { id: productId } = useParams<{ id: string }>();
  const location = useLocation() as {
    pathname: string;
    state?: { product?: Product; buyerId?: string; roomId?: string };
  };
  const { state } = location;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(state?.product ?? null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pollingRoom, setPollingRoom] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const buyerHint = state?.buyerId;

  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, [user, authLoading, navigate, location.pathname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages]);

  useEffect(() => {
    if (!productId || !user || authLoading) return;
    let alive = true;
    const fetchProductIfNeeded = async () => {
      if (product) return;
      try {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
          credentials: "include",
        });
        const json = await safeJsonParse(res);
        if (!res.ok || json.ok === false) throw new Error(json.error || "불러오기 실패");
        if (!alive) return;
        setProduct(json.product);
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "채팅방을 불러오지 못했습니다.");
      }
    };
    fetchProductIfNeeded();
    return () => {
      alive = false;
    };
  }, [productId, product, user]);

  const loadRooms = useCallback(async () => {
    if (!productId || !user || authLoading) return;
    try {
      const res = await fetch(`${API_BASE}/chat/rooms?productId=${productId}`, {
        credentials: "include",
      });
      const data = await safeJsonParse(res);
      if (res.ok && data.ok !== false && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch (e: any) {
      console.error("Failed to load rooms:", e);
    }
  }, [productId, user, authLoading]);

  const loadRoom = useCallback(async () => {
    if (!productId || !user || authLoading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/chat/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          buyerId: buyerHint,
        }),
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.ok === false) throw new Error(data.error || "채팅을 열 수 없습니다.");
      setRoom(data.room);
      loadRooms();
    } catch (e: any) {
      setErr(e.message || "채팅방을 열 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [productId, user, buyerHint, authLoading, loadRooms]);

  useEffect(() => {
    if (!user || authLoading) return;
    loadRoom();
  }, [loadRoom, user, authLoading]);

  const refreshRoom = useCallback(
    async (targetRoomId: string) => {
      if (!targetRoomId || pollingRoom) return;
      setPollingRoom(true);
      try {
        const res = await fetch(`${API_BASE}/chat/room/${targetRoomId}`, {
          credentials: "include",
        });
        const data = await safeJsonParse(res);
        if (res.ok && data.ok !== false) {
          setRoom(data.room);
        }
      } finally {
        setPollingRoom(false);
      }
    },
    [pollingRoom]
  );

  useEffect(() => {
    if (!room?.id) return;
    const timer = setInterval(() => refreshRoom(room.id), 4000);
    return () => clearInterval(timer);
  }, [room?.id, refreshRoom]);

  const sendMessage = async () => {
    if (!room?.id || !input.trim() || sending) return;
    const text = input.trim();
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`${API_BASE}/chat/room/${room.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.ok === false) throw new Error(data.error || "전송에 실패했습니다.");
      setRoom((prev) => data.room ?? prev);
    } catch (e: any) {
      alert(e.message || "메시지를 보내지 못했습니다.");
      setInput((prev) => `${text}${prev ? `\n${prev}` : ""}`);
    } finally {
      setSending(false);
    }
  };

  const productInfo = useMemo(() => {
    const prod = product || (room?.product
      ? ({
        ...room.product,
        _id: room.product.id,
      } as unknown as Product)
      : null);
    if (!prod && !room?.product) return null;
    const pickImage = (img?: string) =>
      img ? (img.startsWith("http") ? img : `${SERVER}${img}`) : null;
    const imgSrc =
      pickImage(prod?.images?.[0]) ||
      pickImage(room?.product?.images?.[0]) ||
      "/placeholder.png";
    const title = prod?.title || room?.product?.title || "상품";
    const price =
      prod?.price ?? room?.product?.price ?? 0;
    const productSlug = prod?._id || room?.product?.id;

    return (
      <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center">
        <div className="w-20 h-20 overflow-hidden bg-gray-100 rounded-2xl sm:w-24 sm:h-24">
          <img src={imgSrc} alt={title} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-sm text-gray-500">
            {prod?.sellerUserId || room?.seller?.userId || "판매자"}
          </div>
          <div className="text-lg font-semibold line-clamp-2 sm:text-xl">{title}</div>
          <div className="text-base font-bold sm:text-lg">
            {Number(price).toLocaleString()}원
          </div>
        </div>
        {productSlug && (
          <div className="sm:self-start">
            <button
              className="px-4 py-2 text-sm text-black border rounded-full hover:bg-gray-100"
              onClick={() => navigate(`/listing/${productSlug}`)}
            >
              상품 보기
            </button>
          </div>
        )}
      </div>
    );
  }, [product, room, navigate]);

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-gray-600 sm:px-6 lg:px-8">
        채팅방을 여는 중...
      </div>
    );
  }

  if (err || !room) {
    return (
      <div className="px-4 py-10 text-center text-gray-600 sm:px-6 lg:px-8">
        {err || "채팅방을 찾을 수 없습니다."}
      </div>
    );
  }

  const isSeller = product && user && String(product.seller) === user.id;
  const showUserList = isSeller && rooms.length > 1;

  const switchRoom = async (targetBuyerId: string) => {
    if (!productId || !user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId,
          buyerId: targetBuyerId,
        }),
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.ok === false) throw new Error(data.error || "채팅을 열 수 없습니다.");
      setRoom(data.room);
    } catch (e: any) {
      alert(e.message || "채팅방을 열 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className={`grid gap-4 ${showUserList ? "grid-cols-[200px_1fr]" : "grid-cols-1"}`}>
          {/* 사용자 목록 (판매자이고 여러 채팅이 있을 때만 표시) */}
          {showUserList && (
            <div className="overflow-hidden bg-white border shadow-sm rounded-3xl">
              <div className="p-4 border-b">
                <h3 className="font-semibold">채팅 목록</h3>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                {rooms.map((r) => {
                  const isActive = r.id === room?.id;
                  const otherUser = r.buyer;
                  const profileImage = otherUser?.profileImage
                    ? otherUser.profileImage.startsWith("http")
                      ? otherUser.profileImage
                      : `${SERVER}${otherUser.profileImage}`
                    : null;

                  return (
                    <button
                      key={r.id}
                      onClick={() => switchRoom(otherUser?.id || "")}
                      className={`w-full p-3 flex items-center gap-3 border-b hover:bg-gray-50 transition ${
                        isActive ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-200 rounded-full">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={otherUser?.userId || "사용자"}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-300 to-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold truncate">
                          {otherUser?.userId || "알 수 없음"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {r.messages && r.messages.length > 0
                            ? r.messages[r.messages.length - 1].text
                            : "메시지 없음"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 채팅 영역 */}
          <div className="overflow-hidden bg-white border shadow-sm rounded-3xl">
        {productInfo}
        <div className="h-[60vh] min-h-[320px] overflow-y-auto p-4 space-y-3 bg-gray-50">
          {room.messages?.length === 0 && (
            <div className="py-10 text-sm text-center text-gray-500">
              첫 메시지를 보내보세요.
            </div>
          )}
          {room.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  msg.isMine
                    ? "bg-black text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                <div>{msg.text}</div>
                <div className="mt-1 text-[10px] opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex flex-col gap-3 p-4 border-t sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 px-4 py-3 text-sm border rounded-full focus:ring-2 focus:ring-neutral-800 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`w-full px-4 py-3 text-sm font-semibold rounded-full sm:w-auto ${
              sending || !input.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            전송
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
