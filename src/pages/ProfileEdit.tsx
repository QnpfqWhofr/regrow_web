import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const SERVER = (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:4000";

const getImageUrl = (src?: string | null) =>
  src ? (src.startsWith("http") ? src : `${SERVER}${src}`) : null;

export default function ProfileEdit() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(
    getImageUrl(user?.profileImage ?? null)
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true, state: { from: "/profile/edit" } });
    }
  }, [user, loading, navigate]);

  if (!user) {
    return (
      <div className="container py-10 text-center text-gray-600">
        로그인 정보 확인 중...
      </div>
    );
  }

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp|bmp)$/i.test(file.type)) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 용량은 5MB 이하만 가능합니다.");
      return;
    }
    setError(null);
    setFile(file);
    if (tempUrl) {
      URL.revokeObjectURL(tempUrl);
      setTempUrl(null);
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setTempUrl(url);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("업로드할 프로필 이미지를 선택해주세요.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const uploadRes = await fetch(`${API_BASE}/uploads/images`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || uploadJson.ok === false || !uploadJson.urls?.[0]) {
        throw new Error(uploadJson.error || "이미지 업로드에 실패했습니다.");
      }
      const relativePath = uploadJson.urls[0];
      const profileImage = relativePath;

      const patchRes = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileImage }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok || patchJson.ok === false) {
        throw new Error(patchJson.error || "프로필 업데이트에 실패했습니다.");
      }

      await refresh();
      navigate("/mypage");
    } catch (err: any) {
      setError(err.message || "문제가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      if (tempUrl) URL.revokeObjectURL(tempUrl);
    };
  }, [tempUrl]);

  return (
    <div className="container py-10">
      <div className="max-w-lg p-6 mx-auto space-y-6 card">
        <div>
          <h1 className="text-2xl font-bold">프로필 사진 변경</h1>
          <p className="mt-2 text-sm text-gray-600">
            새로 올릴 프로필 이미지를 선택하고 저장하세요. 5MB 이하의 이미지 파일만 가능합니다.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="overflow-hidden bg-gray-100 border border-gray-200 rounded-full size-36">
            {preview ? (
              <img src={preview} alt="미리보기" className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-600" />
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              이미지 선택
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </div>

          <div className="flex items-center gap-3">
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

