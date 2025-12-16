// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ML from '../assets/ReGrowlogo.png';

type LocationState = { from?: string } | null;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authBusy } = useAuth();

  const [userId, setUserId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = userId.trim().length > 0 && pw.length > 0 && !authBusy;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setErr(null);
      await login(userId, pw);

      const state = location.state as LocationState;
      const from =
        state?.from && typeof state.from === "string" ? state.from : "/";
      navigate(from, { replace: true });
    } catch (e: any) {
      setErr(e.message || "로그인 실패");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-gradient-to-tr from-green-200/30 to-cyan-200/30 blur-3xl -z-10"></div>
      
      <div className="w-full max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* 왼쪽 브랜딩 영역 */}
          <div className="relative flex-col items-center justify-center hidden p-16 overflow-hidden shadow-2xl lg:flex bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-[2.5rem] group">
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 translate-x-1/2 translate-y-1/2 bg-white rounded-full"></div>
            </div>
            
            <div className="relative space-y-10 text-center">
              <div className="space-y-6">
                <div className="relative inline-block">
                  <img 
                    src={ML} 
                    alt='ReGrow' 
                    className="h-24 mx-auto transition-transform duration-500 drop-shadow-2xl group-hover:scale-110" 
                  />
                </div>
                
                <h1 className="text-5xl font-extrabold leading-tight text-white drop-shadow-lg">
                  환경을 생각하는
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                    스마트한 중고거래
                  </span>
                </h1>
                
                <p className="max-w-md mx-auto text-xl leading-relaxed text-emerald-50">
                  지속가능한 소비문화를 만들어가는
                  <br />
                  새로운 중고거래 플랫폼
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center transition-transform duration-300 hover:scale-110">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 transition-all duration-300 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:shadow-xl">
                    <span className="text-3xl">🌱</span>
                  </div>
                  <p className="text-base font-semibold text-white/95">친환경</p>
                  <p className="mt-1 text-xs text-emerald-100">지구를 지키는</p>
                </div>
                
                <div className="text-center transition-transform duration-300 hover:scale-110">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 transition-all duration-300 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:shadow-xl">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <p className="text-base font-semibold text-white/95">빠른거래</p>
                  <p className="mt-1 text-xs text-emerald-100">신속한 처리</p>
                </div>
                
                <div className="text-center transition-transform duration-300 hover:scale-110">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 transition-all duration-300 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:shadow-xl">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <p className="text-base font-semibold text-white/95">안전보장</p>
                  <p className="mt-1 text-xs text-emerald-100">믿을 수 있는</p>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 로그인 폼 */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <div className="relative p-10 transition-all duration-300 bg-white border shadow-2xl border-gray-100/50 rounded-[2rem] hover:shadow-3xl backdrop-blur-sm">
              {/* 폼 헤더 */}
              <div className="mb-10 text-center">
                <div className="mb-6 lg:hidden">
                  <img src={ML} alt='ReGrow' className="mx-auto h-14 drop-shadow-lg" />
                </div>
                
                <h2 className="mb-3 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                  로그인
                </h2>
                <p className="text-base text-gray-600">
                  계정에 로그인하여 거래를 시작하세요
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* 아이디 입력 */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                    아이디
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="아이디를 입력하세요"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      autoComplete="username"
                      className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    />
                    <div className="absolute inset-y-0 flex items-center pointer-events-none right-4">
                      <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 비밀번호 입력 */}
                <div className="space-y-2 group">
                  <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoComplete="current-password"
                      className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 pr-14 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute p-2 text-gray-400 transition-all duration-200 -translate-y-1/2 rounded-lg right-3 top-1/2 hover:text-emerald-600 hover:bg-emerald-50"
                      title={showPw ? "숨기기" : "보기"}
                    >
                      {showPw ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 에러 메시지 */}
                {err && (
                  <div className="flex items-center gap-3 p-4 text-sm font-medium text-red-700 border-2 border-red-200 shadow-sm bg-red-50 rounded-2xl">
                    <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{err}</span>
                  </div>
                )}

                {/* 로그인 버튼 */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="relative w-full px-6 py-4 mt-2 overflow-hidden font-bold text-white transition-all duration-300 shadow-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 group-hover:opacity-100"></div>
                  <span className="relative flex items-center justify-center gap-2 text-base">
                    {authBusy ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                        로그인 중...
                      </>
                    ) : (
                      <>
                        로그인
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>

                {/* 하단 링크 */}
                <div className="pt-6 space-y-5">
                  <div className="flex items-center justify-center gap-5 text-sm">
                    <Link 
                      to="/find-id" 
                      className="font-medium text-gray-600 transition-all duration-200 hover:text-emerald-600 hover:underline underline-offset-4"
                    >
                      아이디 찾기
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link 
                      to="/find-password" 
                      className="font-medium text-gray-600 transition-all duration-200 hover:text-emerald-600 hover:underline underline-offset-4"
                    >
                      비밀번호 찾기
                    </Link>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-gray-500 bg-white">또는</span>
                    </div>
                  </div>

                  <div className="p-4 text-center transition-all duration-200 border-gray-200 border-dashed rounded-2xl hover:border-emerald-300">
                    <span className="text-sm text-gray-600">계정이 없으신가요? </span>
                    <Link 
                      to="/signup" 
                      className="inline-flex items-center gap-1 text-sm font-bold transition-all duration-200 text-emerald-600 hover:text-emerald-700 hover:gap-2"
                    >
                      회원가입
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
