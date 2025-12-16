import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NavLink, useSearchParams } from "react-router-dom";
import ML from '../assets/ReGrowlogo.png';
import mgi from '../assets/mgi.png';

export default function Header() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // URL 쿼리 파라미터 변경 시 검색어 입력값 동기화
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  const goSell = () => {
    if (user) {
      navigate("/sell");
    } else {
      // 로그인 후 다시 /sell 로 돌아오도록 리다이렉트 상태 전달
      navigate("/login", { state: { from: "/sell" } });
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center max-w-6xl gap-3 px-4 py-3 mx-auto">
        {/* 로고 */}
        <button
          onClick={() => navigate("/")}
          className="text-xl font-extrabold text-neutral-900"
        >
          <img src={ML} alt='ReGrow' className="h-8" />
        </button>

        {/* 검색창 */}
        <form
          onSubmit={handleSearch}
          className="flex items-center flex-1 max-w-xl gap-2 ml-6"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력해주세요"
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-neutral-800 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-black rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-600 hover:to-green-800"
          >
            검색
          </button>
        </form>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-2 ml-auto">
          {/* 판매하기 버튼 — 로그인 여부에 따라 동작 */}
          <button
            onClick={goSell}
            className="px-4 py-2 text-sm font-semibold text-black rounded-lg bg-gradient-to-r from-green-400 to-green-600 hover:from-green-600 hover:to-green-800"
            title={user ? "상품 등록하기" : "로그인하고 상품 등록하기"}
          >
            등록하기
          </button>

          {loading ? (
            <span className="text-sm text-gray-500">확인 중...</span>
          ) : user ? (
            <>
              <span className="text-sm text-gray-700">{user.userId} 님</span>
              <button
                onClick={() => navigate("/mypage")}
                className="px-3 py-1 text-sm text-gray-700 hover:underline"
              >
                <img src={mgi} alt='마이페이지' className="inline h-5 mb-1 mr-1" />
                마이
              </button>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-black rounded bg-gradient-to-r from-green-400 to-green-600 hover:from-green-600 hover:to-green-800"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                로그인
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-3 py-1 text-sm text-black rounded bg-gradient-to-r from-green-400 to-green-600 hover:from-green-600 hover:to-green-800"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      {/* 하단 카테고리 메뉴 */}
      <div className="flex max-w-6xl gap-6 px-4 py-1 mx-auto text-sm text-gray-600">
        {[
          { to: "/feed/recommend", label: "추천" },
          { to: "/categories", label: "카테고리" },
          { to: "/feed/hot", label: "인기" },
          { to: "/feed/new", label: "최신" },
          { to: "/game", label: "나무" },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `hover:text-neutral-900 ${
                isActive ? "text-neutral-900 font-medium" : ""
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
