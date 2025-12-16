import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ML from '../assets/ReGrowlogo.png';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function FindPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  
  // 이메일 입력 단계
  const [email, setEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // 비밀번호 재설정 단계
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setEmailBusy(true);
    setEmailError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/find-password/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "인증코드 전송에 실패했습니다.");
      }

      setStep("reset");
    } catch (err: any) {
      setEmailError(err.message || "문제가 발생했습니다.");
    } finally {
      setEmailBusy(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() || !newPassword || !confirmPassword) return;
    
    if (newPassword.length < 4) {
      setResetError("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setResetError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setResetBusy(true);
    setResetError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/find-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          code: code.trim(), 
          newPassword 
        }),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "비밀번호 재설정에 실패했습니다.");
      }

      setStep("success");
    } catch (err: any) {
      setResetError(err.message || "문제가 발생했습니다.");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-gradient-to-tr from-green-200/30 to-cyan-200/30 blur-3xl -z-10"></div>
      
      <div className="w-full max-w-md mx-auto">
        <div className="relative p-10 transition-all duration-300 bg-white border shadow-2xl border-gray-100/50 rounded-[2rem] hover:shadow-3xl backdrop-blur-sm">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <div className="mb-6">
              <img src={ML} alt='ReGrow' className="mx-auto h-14 drop-shadow-lg" />
            </div>
            
            <h2 className="mb-3 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
              비밀번호 찾기
            </h2>
            <p className="text-sm text-gray-600">
              {step === "email" && "가입 시 사용한 이메일을 입력하세요"}
              {step === "reset" && "인증코드와 새 비밀번호를 입력하세요"}
              {step === "success" && "비밀번호가 성공적으로 변경되었습니다"}
            </p>
          </div>

          {/* 이메일 입력 단계 */}
          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-6">
              <div className="space-y-2 group">
                <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                  이메일
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    required
                  />
                  <div className="absolute inset-y-0 flex items-center pointer-events-none right-4">
                    <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {emailError && (
                <div className="flex items-center gap-3 p-4 text-sm font-medium text-red-700 border-2 border-red-200 shadow-sm bg-red-50 rounded-2xl">
                  <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{emailError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!email.trim() || emailBusy}
                className="relative w-full px-6 py-4 mt-2 overflow-hidden font-bold text-white transition-all duration-300 shadow-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              >
                <span className="relative flex items-center justify-center gap-2 text-base">
                  {emailBusy ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                      전송 중...
                    </>
                  ) : (
                    "인증코드 전송"
                  )}
                </span>
              </button>
            </form>
          )}

          {/* 비밀번호 재설정 단계 */}
          {step === "reset" && (
            <form onSubmit={resetPassword} className="space-y-6">
              <div className="p-4 border-2 border-emerald-200 shadow-sm bg-emerald-50 rounded-2xl">
                <p className="text-sm text-emerald-700">
                  <strong>{email}</strong>로 인증코드를 전송했습니다.
                </p>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                  인증코드 (6자리)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-5 py-4 text-base text-center transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="새 비밀번호 (최소 4자)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 pr-14 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    minLength={4}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute p-2 text-gray-400 transition-all duration-200 -translate-y-1/2 rounded-lg right-3 top-1/2 hover:text-emerald-600 hover:bg-emerald-50"
                  >
                    {showPassword ? (
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

              <div className="space-y-2 group">
                <label className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {resetError && (
                <div className="flex items-center gap-3 p-4 text-sm font-medium text-red-700 border-2 border-red-200 shadow-sm bg-red-50 rounded-2xl">
                  <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{resetError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 transition-all duration-200 border-2 border-gray-200 rounded-2xl hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={code.length !== 6 || !newPassword || !confirmPassword || resetBusy}
                  className="flex-[2] relative px-6 py-3 overflow-hidden font-bold text-white transition-all duration-300 shadow-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                >
                  <span className="relative flex items-center justify-center gap-2 text-sm">
                    {resetBusy ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        변경 중...
                      </>
                    ) : (
                      "비밀번호 변경"
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* 성공 단계 */}
          {step === "success" && (
            <div className="space-y-6 text-center">
              <div className="p-6 border-2 border-emerald-200 shadow-sm bg-emerald-50 rounded-2xl">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-emerald-700">비밀번호 변경 완료!</h3>
                <p className="text-sm text-emerald-600">
                  비밀번호가 성공적으로 변경되었습니다.<br />
                  새로운 비밀번호로 로그인해주세요.
                </p>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="w-full relative px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 shadow-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 group"
              >
                <span className="relative flex items-center justify-center gap-2 text-base">
                  로그인하기
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          )}

          {/* 하단 링크 */}
          {step !== "success" && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-5 text-sm">
                <Link 
                  to="/login" 
                  className="font-medium text-gray-600 transition-all duration-200 hover:text-emerald-600 hover:underline underline-offset-4"
                >
                  로그인
                </Link>
                <span className="text-gray-300">|</span>
                <Link 
                  to="/find-id" 
                  className="font-medium text-gray-600 transition-all duration-200 hover:text-emerald-600 hover:underline underline-offset-4"
                >
                  아이디 찾기
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}