import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../context/GameContext";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

type SelFile = { file: File; preview: string; id: string };

const CATEGORIES = [
  "디지털/가전",
  "가구/인테리어",
  "생활/주방",
  "유아동",
  "패션/잡화",
  "도서/음반/문구",
  "스포츠/레저",
  "반려동물용품",
  "티켓/서비스",
  "기타",
];

export default function ProductNew() {
  const { addCoins } = useGame();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRaw, setPriceRaw] = useState<string>("");
  const price = useMemo(
    () => Number(priceRaw.replace(/[^\d]/g, "") || 0),
    [priceRaw]
  );

  const [category, setCategory] = useState("기타");
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<"상" | "중" | "하">("중");
  const [tradeMethod, setTradeMethod] = useState<"비대면" | "대면">("비대면");
  const [shippingFee, setShippingFee] = useState<"포함" | "미포함">("포함");
  const [shippingCostRaw, setShippingCostRaw] = useState<string>("");
  const shippingCost = useMemo(
    () => Number(shippingCostRaw.replace(/[^\d]/g, "") || 0),
    [shippingCostRaw]
  );
  const [selFiles, setSelFiles] = useState<SelFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => selFiles.forEach((s) => URL.revokeObjectURL(s.preview)),
    [selFiles]
  );

  const onPriceChange = (val: string) => {
    const digits = val.replace(/[^\d]/g, "");
    if (!digits) return setPriceRaw("");
    setPriceRaw(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const onShippingCostChange = (val: string) => {
    const digits = val.replace(/[^\d]/g, "");
    if (!digits) return setShippingCostRaw("");
    setShippingCostRaw(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const addFiles = (files: File[]) => {
    const remain = 5 - selFiles.length;
    if (remain <= 0) return;
    const valid = files
      .slice(0, remain)
      .filter((f) => /^image\/(png|jpe?g|gif|webp|bmp)$/i.test(f.type))
      .filter((f) => f.size <= 5 * 1024 * 1024);
    const mapped: SelFile[] = valid.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    setSelFiles((prev) => [...prev, ...mapped]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.currentTarget.value = "";
  };

  // 드래그&드롭 시각 피드백
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      el.classList.add("ring-2", "ring-neutral-900");
    };
    const onDragLeave = () => el.classList.remove("ring-2", "ring-neutral-900");
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      onDragLeave();
      addFiles(Array.from(e.dataTransfer?.files || []));
    };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [selFiles.length]);

  async function uploadImages(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch(`${API_BASE}/uploads/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || data.ok === false)
      throw new Error(data.error || "이미지 업로드 실패");
    return data.urls as string[];
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, price: true });
    setOkMsg(null);
    setErrMsg(null);
    if (!title.trim() || price <= 0) {
      setErrMsg("필수 항목을 확인해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const urls = await uploadImages(selFiles.map((s) => s.file));
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price,
          category,
          location: location.trim() || "미정",
          images: urls,
          brand: brand.trim(),
          condition,
          tradeMethod,
          shippingFee,
          shippingCost: shippingFee === "미포함" ? shippingCost : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false)
        throw new Error(data.error || "등록 실패");

      setOkMsg("✅ 상품이 등록되었습니다!");
      // 거래(등록) 1회로 간주하여 보상 지급(데모)
      addCoins(20);
      setTitle("");
      setDescription("");
      setPriceRaw("");
      setCategory("기타");
      setLocation("");
      setBrand("");
      setCondition("중");
      setTradeMethod("비대면");
      setShippingFee("포함");
      setShippingCostRaw("");
      setSelFiles([]);
      setTouched({});
    } catch (e: any) {
      setErrMsg(e.message || "문제가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const titleError = touched.title && !title.trim();
  const priceError = touched.price && price <= 0;

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-8 text-3xl font-extrabold">상품 등록</h1>

        {okMsg && <div className="alert-ok">{okMsg}</div>}
        {errMsg && <div className="alert-err">{errMsg}</div>}

        <form onSubmit={onSubmit} className="grid gap-6 p-6 card">
          {/* 제목 */}
          <div>
            <label className="form-label form-required">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, title: true }))}
              className={titleError ? "input-error" : "input"}
              placeholder="예) 중고 책 · 상급 · 포장만 뜯은 상태"
              maxLength={60}
            />
            <p className="form-hint">
              최대 60자. 상품 핵심이 드러나게 적어주세요.
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="form-label">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea"
              rows={6}
              placeholder={`상세 상태(사용감/하자), 구성품, 교환/환불 안내 등\n예) 거의 새것, 책갈피 사은품 포함`}
            />
            <div className="form-counter">{description.length}/1000</div>
          </div>

          {/* 가격 + 카테고리 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label form-required">가격(원)</label>
              <input
                inputMode="numeric"
                value={priceRaw}
                onChange={(e) => onPriceChange(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, price: true }))}
                className={priceError ? "input-error" : "input"}
                placeholder="예) 12,000"
              />
              <p className="form-hint">
                숫자만 입력하면 자동으로 3자리 콤마가 적용돼요.
              </p>
            </div>

            <div>
              <label className="form-label">카테고리</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="form-hint">
                적절한 분류를 선택하면 검색에 더 잘 노출돼요.
              </p>
            </div>
          </div>

          {/* 위치 */}
          <div>
            <label className="form-label">거래 지역</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="예) 대구 수성구"
            />
            <p className="form-hint">
              직거래를 원하시면 동/구 단위로 적어주세요. (선택)
            </p>
          </div>

          {/* 브랜드 + 제품상태 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">브랜드</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="input"
                placeholder="예) 삼성, 애플, 나이키"
                maxLength={50}
              />
              <p className="form-hint">브랜드명을 입력하세요. (선택)</p>
            </div>

            <div>
              <label className="form-label">제품상태</label>
              <select
                className="select"
                value={condition}
                onChange={(e) => setCondition(e.target.value as "상" | "중" | "하")}
              >
                <option value="상">상 (거의 새것)</option>
                <option value="중">중 (사용감 있음)</option>
                <option value="하">하 (많이 사용함)</option>
              </select>
              <p className="form-hint">제품의 상태를 선택하세요.</p>
            </div>
          </div>

          {/* 거래방식 */}
          <div>
            <label className="form-label">거래방식</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tradeMethod"
                  value="비대면"
                  checked={tradeMethod === "비대면"}
                  onChange={(e) => setTradeMethod(e.target.value as "비대면" | "대면")}
                  className="w-4 h-4"
                />
                <span>비대면 (택배)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tradeMethod"
                  value="대면"
                  checked={tradeMethod === "대면"}
                  onChange={(e) => setTradeMethod(e.target.value as "비대면" | "대면")}
                  className="w-4 h-4"
                />
                <span>대면 (직거래)</span>
              </label>
            </div>
            <p className="form-hint">원하는 거래 방식을 선택하세요.</p>
          </div>

          {/* 배송비 (비대면일 경우만) */}
          {tradeMethod === "비대면" && (
            <div>
              <label className="form-label">배송비</label>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingFee"
                      value="포함"
                      checked={shippingFee === "포함"}
                      onChange={(e) => setShippingFee(e.target.value as "포함" | "미포함")}
                      className="w-4 h-4"
                    />
                    <span>배송비 포함</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shippingFee"
                      value="미포함"
                      checked={shippingFee === "미포함"}
                      onChange={(e) => setShippingFee(e.target.value as "포함" | "미포함")}
                      className="w-4 h-4"
                    />
                    <span>배송비 미포함</span>
                  </label>
                </div>
                {shippingFee === "미포함" && (
                  <div>
                    <input
                      inputMode="numeric"
                      value={shippingCostRaw}
                      onChange={(e) => onShippingCostChange(e.target.value)}
                      className="input"
                      placeholder="예) 3,000"
                    />
                    <p className="form-hint">배송비를 입력하세요.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 이미지 */}
          <div>
            <label className="form-label">
              이미지{" "}
              <span className="text-gray-400">(최대 5장, 파일당 5MB)</span>
            </label>

            <div
              ref={dropRef}
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              title="클릭 또는 파일을 드래그해 업로드"
            >
              <div className="text-sm text-gray-700">
                이미지를 드래그하거나 클릭해서 선택하세요
              </div>
              <div className="mt-1 text-xs text-gray-500">
                JPG, PNG, GIF, WEBP, BMP 지원 • 현재 {selFiles.length}/5
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            {selFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3 sm:grid-cols-4 md:grid-cols-5">
                {selFiles.map((s) => (
                  <div key={s.id} className="thumb">
                    <img src={s.preview} className="thumb-img" />
                    <button
                      type="button"
                      className="thumb-del"
                      onClick={() =>
                        setSelFiles((prev) => prev.filter((x) => x.id !== s.id))
                      }
                      aria-label="이미지 제거"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 제출 */}
          <button
            className="btn-primary"
            disabled={busy || !title.trim() || price <= 0}
          >
            {busy ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
