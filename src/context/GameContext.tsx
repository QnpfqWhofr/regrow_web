import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

type GameState = {
	coins: number;
	level: number;
	progressPct: number; // 0~100 (표시용)
	progressPoints: number; // 실제 진행도 포인트
	lastCollectAt: number | null;
	treesGrown: number;
	waterCans: number;
	fertilizers: number;
	growthBoosters: number;
};

type GameContextValue = GameState & {
	addCoins: (amount: number) => void;
	waterTree: () => void;
	fertilizeTree: () => void;
	useGrowthBooster: () => void;
	reset: () => void;
	loading: boolean;
	showCongratulations: boolean;
	dismissCongratulations: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const STORAGE_KEY = "regrow.game.v1";
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

// 레벨별 필요 포인트 계산
function getRequiredPoints(level: number): number {
	return level * 100; // 레벨 1: 100, 레벨 2: 200, 레벨 3: 300
}

// 진행도 퍼센트 계산
function calculateProgressPct(points: number, level: number): number {
	const safePoints = points || 0; // NaN 방지
	const safeLevel = level || 1; // NaN 방지
	const safeRequired = getRequiredPoints(safeLevel);
	return Math.min(100, (safePoints / safeRequired) * 100);
}

function loadInitial(): GameState {
	// 비로그인 시 항상 기본값 반환 (로컬 스토리지 무시)
	return { coins: 0, level: 1, progressPct: 0, progressPoints: 0, lastCollectAt: null, treesGrown: 0, waterCans: 0, fertilizers: 0, growthBoosters: 0 };
}

function persist(state: GameState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {}
}

async function fetchGameFromServer(): Promise<GameState | null> {
	try {
		const res = await fetch(`${API_BASE}/auth/me`, {
			credentials: "include",
		});
		const data = await res.json();
		if (res.ok && data.ok && data.user) {
			const level = data.user.gameLevel ?? 1;
			const progressPct = data.user.gameProgressPct ?? 0;
			let progressPoints = data.user.gameProgressPoints ?? 0;
			
			// progressPoints가 없으면 progressPct를 기반으로 계산
			if (progressPoints === 0 && progressPct > 0) {
				const required = getRequiredPoints(level);
				progressPoints = Math.floor((progressPct / 100) * required);
			}
			
			return {
				coins: data.user.gameCoins ?? 200,
				level,
				progressPct,
				progressPoints,
				lastCollectAt: data.user.gameLastCollectAt ?? null,
				treesGrown: data.user.gameTreesGrown ?? 0,
				waterCans: data.user.gameWaterCans ?? 3,
				fertilizers: data.user.gameFertilizers ?? 2,
				growthBoosters: data.user.gameGrowthBoosters ?? 0,
			};
		}
	} catch {}
	return null;
}

async function saveGameToServer(state: GameState): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE}/auth/game`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				coins: state.coins,
				level: state.level,
				progressPct: state.progressPct,
				progressPoints: state.progressPoints,
				lastCollectAt: state.lastCollectAt,
				treesGrown: state.treesGrown,
				waterCans: state.waterCans,
				fertilizers: state.fertilizers,
				growthBoosters: state.growthBoosters,
			}),
		});
		const data = await res.json();
		return res.ok && data.ok === true;
	} catch {
		return false;
	}
}

export function GameProvider({ children }: { children: React.ReactNode }) {
	const { user, loading: authLoading } = useAuth();
	const [state, setState] = useState<GameState>(() => loadInitial());
	const [loading, setLoading] = useState(true);
	const [showCongratulations, setShowCongratulations] = useState(false);

	// 로그인 상태에 따라 서버에서 게임 정보 로드
	useEffect(() => {
		if (authLoading) return;

		let alive = true;
		(async () => {
			if (user) {
				// 로그인한 경우: 서버에서 로드
				setLoading(true);
				const serverState = await fetchGameFromServer();
				if (alive && serverState) {
					setState(serverState);
					persist(serverState); // 로컬에도 백업
				}
				setLoading(false);
			} else {
				// 비로그인: 항상 기본값 (레벨 1, 프로그레스 0, 코인 0)
				const defaultState = { coins: 0, level: 1, progressPct: 0, progressPoints: 0, lastCollectAt: null, treesGrown: 0, waterCans: 0, fertilizers: 0, growthBoosters: 0 };
				setState(defaultState);
				setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, [user, authLoading]);

	// 상태 변경 시 저장 (로그인한 경우 서버에만 저장, 비로그인은 저장하지 않음)
	useEffect(() => {
		if (loading || authLoading) return;
		if (user) {
			// 로그인한 경우: 서버에 저장하고 로컬에도 백업
			persist(state);
			const timer = setTimeout(() => {
				saveGameToServer(state).catch(() => {});
			}, 500);
			return () => clearTimeout(timer);
		}
		// 비로그인: 저장하지 않음 (항상 기본값 유지)
	}, [state, user, loading, authLoading]);

	const addCoins = useCallback((amount: number) => {
		setState((prev) => ({ ...prev, coins: Math.max(0, prev.coins + amount) }));
	}, []);

	const gainProgress = useCallback((points: number) => {
		setState((prev) => {
			let level = prev.level || 1;
			let progressPoints = (prev.progressPoints || 0) + (points || 0);
			let progressPct = calculateProgressPct(progressPoints, level);
			let treesGrown = prev.treesGrown || 0;
			let coins = prev.coins || 0;
			
			// 레벨업 체크
			while (progressPoints >= getRequiredPoints(level)) {
				progressPoints -= getRequiredPoints(level);
				level += 1;
				
				// 레벨 4 달성 시 축하 팝업 표시 및 리셋
				if (level >= 4) {
					setShowCongratulations(true);
					treesGrown = prev.treesGrown + 1;
					coins = prev.coins + 500; // 나무 완성 보상 500 코인
					level = 1;
					progressPoints = 0;
					break;
				} else {
					// 일반 레벨업 보상
					coins = prev.coins + (level - 1) * 100;
				}
			}
			
			// 최종 퍼센트 계산
			progressPct = calculateProgressPct(progressPoints, level);
			
			return { ...prev, level, progressPct, progressPoints, treesGrown, coins };
		});
	}, []);



	const waterTree = useCallback(() => {
		if (state.waterCans <= 0) {
			alert("물뿌리개가 부족합니다. 상점에서 구매해주세요.");
			return;
		}
		setState(prev => ({ ...prev, waterCans: prev.waterCans - 1 }));
		gainProgress(15); // 15 포인트
	}, [state.waterCans, gainProgress]);

	const fertilizeTree = useCallback(() => {
		if (state.fertilizers <= 0) {
			alert("비료가 부족합니다. 상점에서 구매해주세요.");
			return;
		}
		setState(prev => ({ ...prev, fertilizers: prev.fertilizers - 1 }));
		gainProgress(30); // 30 포인트
	}, [state.fertilizers, gainProgress]);

	const useGrowthBooster = useCallback(() => {
		if (state.growthBoosters <= 0) {
			alert("성장촉진제가 부족합니다. 상점에서 구매해주세요.");
			return;
		}
		setState(prev => ({ ...prev, growthBoosters: prev.growthBoosters - 1 }));
		gainProgress(50); // 50 포인트
	}, [state.growthBoosters, gainProgress]);

	const reset = useCallback(() => {
		const next = { coins: 200, level: 1, progressPct: 0, progressPoints: 0, lastCollectAt: null, treesGrown: 0, waterCans: 3, fertilizers: 2, growthBoosters: 0 };
		setState(next);
		persist(next);
	}, []);

	const dismissCongratulations = useCallback(() => {
		setShowCongratulations(false);
	}, []);

	// LEVEL-UP 보정: progressPct가 100을 넘는 상태를 한 번에 처리
	useEffect(() => {
		if (state.progressPct >= 100) {
			setState((prev) => ({
				...prev,
				level: prev.level + 1,
				progressPct: 0,
			}));
		}
	}, [state.progressPct]);

	const value = useMemo<GameContextValue>(
		() => ({
			...state,
			addCoins,
			waterTree,
			fertilizeTree,
			useGrowthBooster,
			reset,
			loading,
			showCongratulations,
			dismissCongratulations,
		}),
		[state, addCoins, waterTree, fertilizeTree, useGrowthBooster, reset, loading, showCongratulations, dismissCongratulations]
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be used within GameProvider");
	return ctx;
}


