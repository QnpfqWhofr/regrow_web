import { useGame } from "../context/GameContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import TreeLv1 from "../assets/tree1lv.png";
import TreeLv2 from "../assets/tree2lv.png";
import TreeLv3 from "../assets/tree3lv.png";
import AppleTree from "../assets/appletree.png";

export default function Game() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const {
		coins,
		level,
		progressPct,
		progressPoints,
		treesGrown,
		waterCans,
		fertilizers,
		growthBoosters,
		waterTree,
		fertilizeTree,
		useGrowthBooster,
		showCongratulations,
		dismissCongratulations,
	} = useGame();

	// 레벨별 필요 포인트 계산
	const getRequiredPoints = (level: number) => (level || 1) * 100;
	const requiredPoints = getRequiredPoints(level);
	const safeProgressPoints = progressPoints || 0;

	const handleWaterTree = () => {
		if (!user) {
			if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
				navigate("/login", { state: { from: "/game" } });
			}
			return;
		}
		waterTree();
	};

	const handleFertilizeTree = () => {
		if (!user) {
			if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
				navigate("/login", { state: { from: "/game" } });
			}
			return;
		}
		fertilizeTree();
	};

	const handleUseGrowthBooster = () => {
		if (!user) {
			if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
				navigate("/login", { state: { from: "/game" } });
			}
			return;
		}
		useGrowthBooster();
	};

	const getTreeImage = () => {
		if (level === 1) return TreeLv1;
		if (level === 2) return TreeLv2;
		if (level === 3) return TreeLv3;
		return TreeLv1; // 레벨 4는 바로 리셋되므로 보이지 않음
	};

	return (
		<div className="container py-6">
			{/* 축하 팝업 */}
			{showCongratulations && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="max-w-md p-8 mx-4 text-center bg-white rounded-lg">
						<div className="mb-6">
							<img
								src={AppleTree}
								alt="완성된 나무"
								className="object-contain w-32 h-32 mx-auto"
							/>
						</div>
						<h2 className="mb-4 text-2xl font-bold text-green-600">
							🎉 축하합니다! 🎉
						</h2>
						<p className="mb-6 text-gray-700">
							나무가 성장을 완료했어요!<br />
							새로운 나무를 키워보세요.
						</p>
						<div className="mb-6 text-sm text-gray-600">
							<div>🌳 키운 나무: {treesGrown}그루</div>
							<div>💰 보상: 500 코인</div>
						</div>
						<button
							className="w-full btn btn-primary"
							onClick={dismissCongratulations}
						>
							새로운 나무 키우기
						</button>
					</div>
				</div>
			)}
			
			<div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
				{/* 좌측 프로필 카드(간단) */}
				<section className="p-6 space-y-4 card">
					<div className="flex items-center gap-3">
						<div className="flex-shrink-0 overflow-hidden bg-gray-200 rounded-full w-14 h-14">
							{user?.profileImage ? (
								<img
									src={user.profileImage.startsWith("http") 
										? user.profileImage 
										: `${import.meta.env.VITE_SERVER_URL || "http://localhost:4000"}${user.profileImage}`
									}
									alt="프로필"
									className="object-cover w-full h-full"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-green-300 to-green-600" />
							)}
						</div>
						<div>
							<div className="text-lg font-semibold">
								{user ? user.userId : "게스트"}
							</div>
							<div className="text-xs text-gray-500">{user?.location || "대구광역시 수성구 범어동"}</div>
						</div>
					</div>
					<div className="text-sm font-bold">LV.{level}</div>
					<div className="w-full h-2 overflow-hidden bg-gray-100 rounded-full">
						<div className="h-full bg-green-500" style={{ width: `${progressPct}%` }} />
					</div>
					<div className="mt-2 text-xs text-gray-600">
						진행도: {safeProgressPoints}/{requiredPoints}
					</div>
					<div className="text-xs text-gray-600">
						🌳 키운 나무: {treesGrown}그루
					</div>
					<button className="w-full btn btn-primary" onClick={() => navigate("/")}>거래하러 가기</button>
				</section>

				{/* 중앙: 나무 */}
				<section className="flex flex-col items-center p-6 card">
					<div className="w-full max-w-[420px]">
						<img
							src={getTreeImage()}
							alt={`나무 레벨 ${level}`}
							className="object-contain w-full h-full"
						/>
					</div>
					<div className="p-3 mt-4 text-center border border-green-200 rounded-lg bg-green-50">
						<div className="text-sm font-medium text-green-700">
							🎉 레벨업 시 자동으로 코인을 받습니다!
						</div>
						<div className="mt-1 text-xs text-green-600">
							{level < 3 ? (
								`레벨 ${level + 1} 달성 시 ${level * 100} 코인 획득`
							) : (
								"레벨 4 달성 시 나무 완성! 500 코인 획득"
							)}
						</div>
					</div>
				</section>

				{/* 우측: 머니 + 액션 */}
				<section className="space-y-4">
					<div className="flex items-center justify-between p-6 card">
						<div className="flex items-center gap-2">
							<span className="text-yellow-500">⦿</span>
							<div className="text-gray-600">보유 코인</div>
						</div>
						<div className="text-xl font-extrabold">{coins.toLocaleString()} 코인</div>
					</div>
					
					{/* 상점 버튼 */}
					<button
						className="w-full p-4 text-center text-white transition-all duration-200 card hover:shadow-md bg-gradient-to-r from-emerald-500 to-green-500"
						onClick={() => navigate("/shop")}
					>
						<div className="mb-2 text-2xl">🏪</div>
						<div className="font-semibold">상점</div>
						<div className="text-xs opacity-90">아이템 구매하기</div>
					</button>

					<div className="grid grid-cols-2 gap-4">
						<button
							className={`p-6 text-center card hover:shadow-md transition-all ${
								!user || waterCans <= 0 
									? "opacity-50 cursor-not-allowed bg-gray-100" 
									: "hover:bg-blue-50"
							}`}
							onClick={handleWaterTree}
							disabled={!user || waterCans <= 0}
							title={!user ? "로그인이 필요합니다" : waterCans <= 0 ? "물뿌리개가 없습니다" : ""}
						>
							<div className="text-2xl">💧</div>
							<div className="mt-2 font-semibold">물 주기</div>
							<div className="mt-1 text-xs text-gray-500">
								보유: {waterCans}개 / 성장 +15
							</div>
						</button>
						<button
							className={`p-6 text-center card hover:shadow-md transition-all ${
								!user || fertilizers <= 0 
									? "opacity-50 cursor-not-allowed bg-gray-100" 
									: "hover:bg-green-50"
							}`}
							onClick={handleFertilizeTree}
							disabled={!user || fertilizers <= 0}
							title={!user ? "로그인이 필요합니다" : fertilizers <= 0 ? "비료가 없습니다" : ""}
						>
							<div className="text-2xl">🌱</div>
							<div className="mt-2 font-semibold">비료</div>
							<div className="mt-1 text-xs text-gray-500">
								보유: {fertilizers}개 / 성장 +30
							</div>
						</button>
					</div>

					{/* 성장촉진제 버튼 */}
					<button
						className={`w-full p-6 text-center card hover:shadow-md transition-all ${
							!user || growthBoosters <= 0 
								? "opacity-50 cursor-not-allowed bg-gray-100" 
								: "hover:bg-purple-50 border-purple-200"
						}`}
						onClick={handleUseGrowthBooster}
						disabled={!user || growthBoosters <= 0}
						title={!user ? "로그인이 필요합니다" : growthBoosters <= 0 ? "성장촉진제가 없습니다" : ""}
					>
						<div className="text-2xl">⚡</div>
						<div className="mt-2 font-semibold">성장촉진제</div>
						<div className="mt-1 text-xs text-gray-500">
							보유: {growthBoosters}개 / 성장 +50
						</div>
					</button>
				</section>
			</div>
		</div>
	);
}


