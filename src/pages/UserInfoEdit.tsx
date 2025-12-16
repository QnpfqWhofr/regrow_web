import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

export default function UserInfoEdit() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true, state: { from: "/user/edit" } });
    }
    if (user) {
      setUserId(user.userId || "");
      setEmail(user.email || "");
      setLocation(user.location || "대구광역시 수성구 범어동");
    }
  }, [user, loading, navigate]);

  if (!user) {
    return (
      <div className="container py-10 text-center text-gray-600">
        로그인 정보 확인 중...
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 비밀번호 변경 시 유효성 검사
    if (newPassword) {
      if (!currentPassword) {
        setError("현재 비밀번호를 입력해주세요.");
        return;
      }
      if (newPassword.length < 4) {
        setError("새 비밀번호는 최소 4자 이상이어야 합니다.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("새 비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    setBusy(true);
    try {
      const body: any = {
        userId: userId.trim(),
        email: email.trim(),
        location: location.trim(),
      };

      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch(`${API_BASE}/auth/user-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "정보 업데이트에 실패했습니다.");
      }

      await refresh();
      setSuccess("✅ 사용자 정보가 성공적으로 변경되었습니다!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        navigate("/mypage");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "문제가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-lg p-6 mx-auto space-y-6 card">
        <div>
          <h1 className="text-2xl font-bold">사용자 정보 변경</h1>
          <p className="mt-2 text-sm text-gray-600">
            아이디, 이메일, 지역, 비밀번호를 변경할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-600 border border-green-200 rounded-lg bg-green-50">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              아이디
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="아이디"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="이메일"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              지역
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="지역 (예: 대구광역시 수성구 범어동)"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              비밀번호 변경 (선택사항)
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="현재 비밀번호"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="새 비밀번호 (최소 4자)"
                  minLength={4}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="새 비밀번호 확인"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? "저장 중..." : "저장하기"}
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              onClick={() => navigate("/mypage")}
              disabled={busy}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
