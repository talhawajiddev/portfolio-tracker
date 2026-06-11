export type UserRole = "user" | "admin";
export type ThemeMode = "light" | "dark";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  theme: ThemeMode;
}

export interface AdminPortfolioView {
  user_id: string;
  email: string;
  display_name: string | null;
  cash: number;
  positions: { symbol: string; name: string; shares: number; avgCost: number }[];
  orders: { id: string; symbol: string; side: string; shares: number; price: number; total: number; timestamp: number }[];
  updated_at: string;
}
