export interface Player {
  _id: string;
  displayName: string;
  balance: number;
  tags: string[];
  status: "active" | "archived";
  gameToken: string;
  createdAt: string;
  lastSeenAt: string | null;
  depositTotal: number;
  spinCount: number;
}
export interface Audience {
  playerIds: string[];
  tags: string[];
  minBalance: number;
  maxBalance: number;
  minDeposits: number;
}
export type RewardType = "credits" | "wheel" | "chests" | "targets" | "scratch";
export interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "archived";
  rewardType: RewardType;
  rewardValue: number;
  audience: Audience;
}
export interface Award {
  _id: string;
  playerId: string;
  campaignId: string | null;
  type: RewardType;
  value: number;
  status: string;
  createdAt: string;
}
export interface Deposit {
  _id: string;
  playerId: string;
  amount: number;
  createdAt: string;
}
interface Retention {
  eligible: number;
  returned: number;
  rate: number | null;
}
export interface Analytics {
  playerCount: number;
  activePlayers: number;
  totalBalance: number;
  spins: number;
  totalBet: number;
  totalPayout: number;
  deposits: number;
  awards: {
    total: number;
    pending: number;
    credited: number;
    revoked: number;
    creditValue: number;
  };
  retention: {
    real: { d1: Retention; d7: Retention };
    simulated: { d1: Retention; d7: Retention };
  };
  activity: {
    date: string;
    players: number;
    sessions: number;
    simulated: number;
  }[];
}
const base =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5555/api/back-office";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error?.message ||
        data.message ||
        `Request failed (${response.status})`,
    );
  return data as T;
}
export function gameUrl(player: Player) {
  const url = new URL(import.meta.env.VITE_GAME_URL || "http://127.0.0.1:7777");
  url.hash = new URLSearchParams({
    playerId: player._id,
    token: player.gameToken,
  }).toString();
  return url.href;
}
