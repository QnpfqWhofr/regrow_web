// src/pages/Signup.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ML from '../assets/ReGrowlogo.png';

/* ------------------------------ API 유틸 ------------------------------ */
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

/* ------------------------------ Signup ------------------------------ */
type Step = 0 | 1 | 2 | 3;

export default function Signup() {
  const navigate = useNavigate();

  // 단계
  const [step, setStep] = useState<Step>(0);

  // 약관
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAds, setAgreeAds] = useState(false);

  const canGoStep1 = useMemo(
    () => agreeAge && agreePrivacy,
    [agreeAge, agreePrivacy]
  );

  useEffect(() => {
    if (agreeAll) {
      setAgreeAge(true);
      setAgreePrivacy(true);
      setAgreeAds(true);
    }
  }, [agreeAll]);

  useEffect(() => {
    if (agreeAll && (!agreeAge || !agreePrivacy || !agreeAds))
      setAgreeAll(false);
  }, [agreeAge, agreePrivacy, agreeAds]);

  // 계정
  const [userId, setUserId] = useState("");
  const [pw, setPw] = useState("");
  const [pwCheck, setPwCheck] = useState("");

  const canGoStep2 = useMemo(
    () => userId.trim().length >= 3 && pw.length >= 4 && pw === pwCheck,
    [userId, pw, pwCheck]
  );

  // 이메일/코드
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // 타이머
  const [timeLeft, setTimeLeft] = useState(180);
  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [step, timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(1, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 상태
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signing, setSigning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 액션
  const sendCode = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!email || !email.includes("@")) {
      setErr("올바른 이메일을 입력하세요.");
      return;
    }
    try {
      setSending(true);
      await request<{ ok: true; messageId: string }>("/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setTimeLeft(180);
      setVerified(false);
      setMsg("인증코드를 전송했습니다. 메일함을 확인해 주세요.");
      setStep(3);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  }, [email]);

  const verifyCode = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!code.trim()) {
      setErr("인증코드를 입력하세요.");
      return;
    }
    try {
      setVerifying(true);
      const r = await request<{ ok: true; verified: boolean }>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (r.verified) {
        setVerified(true);
        setMsg("이메일 인증이 완료되었습니다. 회원가입을 진행하세요.");
      }
    } catch (e: any) {
      setVerified(false);
      setErr(e.message);
    } finally {
      setVerifying(false);
    }
  }, [email, code]);

  const doSignup = useCallback(async () => {
    setErr(null);
    setMsg(null);
    if (!verified) {
      setErr("이메일 인증을 먼저 완료하세요.");
      return;
    }
    try {
      setSigning(true);
      await request<{ ok: true }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ userId, password: pw, email }),
      });
      alert("회원가입이 완료되었습니다! 로그인 화면으로 이동합니다.");
      navigate("/login");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSigning(false);
    }
  }, [verified, userId, pw, email, navigate]);

  const stepTitles = [
    "약관 동의",
    "계정 정보",
    "이메일 인증",
    "인증 완료"
  ];

  const stepDescriptions = [
    "서비스 이용을 위한 약관에 동의해주세요",
    "사용하실 계정 정보를 입력해주세요",
    "이메일 인증을 진행해주세요",
    "인증코드를 입력하고 가입을 완료하세요"
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* 배경 데코레이션 */}
      <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 rounded-full w-96 h-96 bg-gradient-to-tr from-green-200/30 to-cyan-200/30 blur-3xl -z-10"></div>

      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100/50 overflow-hidden backdrop-blur-sm">
          <div className="grid lg:grid-cols-5">
            {/* 왼쪽 사이드바 - 진행 상황 */}
            <div className="relative p-8 overflow-hidden lg:col-span-2 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 lg:p-12">
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 translate-x-1/2 translate-y-1/2 bg-white rounded-full"></div>
              </div>

              <div className="relative space-y-10">
                <div className="text-center lg:text-left">
                  <img 
                    src={ML} 
                    alt='ReGrow' 
                    className="h-20 mx-auto mb-6 transition-transform duration-500 lg:mx-0 drop-shadow-2xl hover:scale-110" 
                  />
                  <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white drop-shadow-lg">
                    ReGrow와 함께
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100">
                      시작하세요
                    </span>
                  </h1>
                  <p className="text-lg leading-relaxed text-emerald-50">
                    지속가능한 중고거래의 새로운 경험
                  </p>
                </div>

                {/* 진행 단계 */}
                <div className="space-y-5">
                  {stepTitles.map((title, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        index < step 
                          ? "bg-white text-emerald-600 shadow-lg scale-110" 
                          : index === step
                          ? "bg-white text-emerald-600 shadow-xl scale-110 ring-4 ring-white/30"
                          : "bg-white/20 text-white/60 backdrop-blur-sm"
                      }`}>
                        {index < step ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-semibold text-base transition-all duration-300 block ${
                          index <= step ? "text-white" : "text-white/60"
                        }`}>
                          {title}
                        </span>
                        {index === step && (
                          <span className="block mt-1 text-xs text-emerald-100">
                            진행 중
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 진행률 바 */}
                <div className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white/90">진행률</span>
                    <span className="text-sm font-bold text-white">{Math.round((step / 3) * 100)}%</span>
                  </div>
                  <div className="w-full h-3 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
                    <div 
                      className="h-full transition-all duration-500 rounded-full shadow-lg bg-gradient-to-r from-white to-emerald-100"
                      style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 특징 */}
                <div className="pt-6 space-y-4 border-t border-white/20">
                  <div className="flex items-center gap-3 transition-transform duration-300 text-white/90 hover:translate-x-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                      <span className="text-xl">🌱</span>
                    </div>
                    <span className="text-sm font-medium">친환경 중고거래</span>
                  </div>
                  <div className="flex items-center gap-3 transition-transform duration-300 text-white/90 hover:translate-x-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                      <span className="text-xl">🔒</span>
                    </div>
                    <span className="text-sm font-medium">안전한 거래 보장</span>
                  </div>
                  <div className="flex items-center gap-3 transition-transform duration-300 text-white/90 hover:translate-x-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                      <span className="text-xl">⚡</span>
                    </div>
                    <span className="text-sm font-medium">빠른 거래 매칭</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 폼 영역 */}
            <div className="p-8 lg:col-span-3 lg:p-12">
              <div className="max-w-md mx-auto">
                {/* 헤더 */}
                <div className="mb-10">
                  <div className="inline-block px-4 py-2 mb-4 text-sm font-semibold rounded-full text-emerald-600 bg-emerald-50">
                    Step {step + 1} of 4
                  </div>
                  <h2 className="mb-3 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">
                    {stepTitles[step]}
                  </h2>
                  <p className="text-base leading-relaxed text-gray-600">
                    {stepDescriptions[step]}
                  </p>
                </div>

                {/* Step 0: 약관 */}
                {step === 0 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canGoStep1) setStep(1);
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <label className="flex items-start gap-4 p-5 transition-all duration-200 border-2 border-gray-200 cursor-pointer rounded-2xl hover:bg-emerald-50/50 hover:border-emerald-300 group">
                        <input
                          type="checkbox"
                          className="w-6 h-6 mt-0.5 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                          checked={agreeAll}
                          onChange={(e) => setAgreeAll(e.target.checked)}
                        />
                        <div className="flex-1">
                          <div className="mb-1 text-lg font-bold text-gray-900">전체 동의</div>
                          <div className="text-sm text-gray-600">모든 약관에 동의합니다</div>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 transition-colors group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </label>

                      <div className="pl-6 space-y-3 border-l-4 border-emerald-100">
                        <label className="flex items-start gap-3 py-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                            checked={agreeAge}
                            onChange={(e) => setAgreeAge(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 transition-colors group-hover:text-emerald-600">
                              만 14세 이상입니다
                            </span>
                            <span className="ml-1 font-semibold text-red-500">(필수)</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 py-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                            checked={agreePrivacy}
                            onChange={(e) => setAgreePrivacy(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 transition-colors group-hover:text-emerald-600">
                              개인정보 처리방침 동의
                            </span>
                            <span className="ml-1 font-semibold text-red-500">(필수)</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 py-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                            checked={agreeAds}
                            onChange={(e) => setAgreeAds(e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 transition-colors group-hover:text-emerald-600">
                              마케팅 정보 수신 동의
                            </span>
                            <span className="ml-1 font-semibold text-gray-500">(선택)</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canGoStep1}
                      className="relative w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 group-hover:opacity-100"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        다음 단계
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </button>
                  </form>
                )}

                {/* Step 1: 계정 정보 */}
                {step === 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canGoStep2) setStep(2);
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-5">
                      <div className="group">
                        <label className="block mb-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                          아이디
                        </label>
                        <input
                          type="text"
                          placeholder="아이디를 입력하세요 (3자 이상)"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          autoComplete="username"
                          className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                        />
                        {userId && userId.trim().length < 3 && (
                          <p className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            3자 이상 입력해주세요
                          </p>
                        )}
                      </div>

                      <div className="group">
                        <label className="block mb-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                          비밀번호
                        </label>
                        <input
                          type="password"
                          placeholder="비밀번호를 입력하세요 (4자 이상)"
                          value={pw}
                          onChange={(e) => setPw(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                        />
                        {pw && pw.length < 4 && (
                          <p className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            4자 이상 입력해주세요
                          </p>
                        )}
                      </div>

                      <div className="group">
                        <label className="block mb-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                          비밀번호 확인
                        </label>
                        <input
                          type="password"
                          placeholder="비밀번호를 다시 입력하세요"
                          value={pwCheck}
                          onChange={(e) => setPwCheck(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                        />
                        {pw && pwCheck && (
                          pw === pwCheck ? (
                            <p className="flex items-center gap-1 mt-2 text-sm font-medium text-emerald-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              비밀번호가 일치합니다
                            </p>
                          ) : (
                            <p className="flex items-center gap-1 mt-2 text-sm font-medium text-red-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              비밀번호가 일치하지 않습니다
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="flex-1 px-4 py-4 font-semibold text-gray-700 transition-all duration-200 border-2 border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={!canGoStep2}
                        className="relative flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 group-hover:opacity-100"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          다음 단계
                          <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: 이메일 입력 */}
                {step === 2 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                    className="space-y-6"
                  >
                    <div className="group">
                      <label className="block mb-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                        이메일 주소
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="이메일을 입력하세요"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          className="w-full px-5 py-4 text-base transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                        />
                        <div className="absolute inset-y-0 flex items-center pointer-events-none right-4">
                          <svg className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {msg && (
                      <div className="flex items-center gap-3 p-4 text-sm font-medium border-2 shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 rounded-2xl">
                        <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{msg}</span>
                      </div>
                    )}

                    {err && (
                      <div className="flex items-center gap-3 p-4 text-sm font-medium text-red-700 border-2 border-red-200 shadow-sm bg-red-50 rounded-2xl">
                        <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{err}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 px-4 py-4 font-semibold text-gray-700 transition-all duration-200 border-2 border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={sending || !email.includes("@")}
                        className="relative flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 group-hover:opacity-100"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {sending ? (
                            <>
                              <div className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                              전송 중...
                            </>
                          ) : (
                            <>
                              인증코드 전송
                              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: 인증코드 입력 */}
                {step === 3 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      doSignup();
                    }}
                    className="space-y-6"
                  >
                    <div className="group">
                      <label className="block mb-2 text-sm font-semibold text-gray-700">
                        이메일 주소
                      </label>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-5 py-4 text-base font-medium text-gray-600 bg-gray-100 border-2 border-gray-200 rounded-2xl"
                      />
                    </div>

                    <div className="group">
                      <label className="block mb-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-emerald-600">
                        인증코드
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="인증코드 6자리"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="flex-1 px-5 py-4 text-base text-xl font-bold tracking-widest text-center transition-all duration-200 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-gray-400 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={verifyCode}
                          disabled={verifying || !code.trim()}
                          className="px-8 py-4 font-bold text-gray-700 transition-all duration-200 bg-gray-100 border-2 border-gray-200 rounded-2xl hover:bg-gray-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300"
                        >
                          {verifying ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-gray-700 animate-spin"></div>
                            </div>
                          ) : (
                            "확인"
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between px-1 mt-3">
                        <span className={`text-sm font-semibold ${timeLeft < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                          <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          남은 시간: {formatTime(timeLeft)}
                        </span>
                        <button
                          type="button"
                          onClick={sendCode}
                          disabled={sending}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 hover:underline underline-offset-2"
                        >
                          재전송
                        </button>
                      </div>
                    </div>

                    {verified && (
                      <div className="flex items-center gap-3 p-4 text-sm font-medium border-2 shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 rounded-2xl">
                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span>이메일 인증이 완료되었습니다</span>
                      </div>
                    )}

                    {msg && !verified && (
                      <div className="flex items-center gap-3 p-4 text-sm font-medium border-2 shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 rounded-2xl">
                        <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>{msg}</span>
                      </div>
                    )}

                    {err && (
                      <div className="flex items-center gap-3 p-4 text-sm font-medium text-red-700 border-2 border-red-200 shadow-sm bg-red-50 rounded-2xl">
                        <svg className="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{err}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex-1 px-4 py-4 font-semibold text-gray-700 transition-all duration-200 border-2 border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400"
                      >
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={!verified || signing}
                        className="relative flex-1 py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 shadow-xl overflow-hidden group"
                      >
                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 group-hover:opacity-100"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          {signing ? (
                            <>
                              <div className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                              가입 중...
                            </>
                          ) : (
                            <>
                              회원가입 완료
                              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 하단 링크 */}
                <div className="pt-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-gray-500 bg-white">또는</span>
                    </div>
                  </div>
                  <div className="p-4 transition-all duration-200 border-gray-200 border-dashed rounded-2xl">
                    <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
                    <Link 
                      to="/login" 
                      className="inline-flex items-center gap-1 text-sm font-bold transition-all text-emerald-600 hover:text-emerald-700 hover:gap-2"
                    >
                      로그인
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
