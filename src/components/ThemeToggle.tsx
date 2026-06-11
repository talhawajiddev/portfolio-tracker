"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeMode } from "@/types/auth";

export function ThemeToggle({
  userId,
  initialTheme,
}: {
  userId?: string;
  initialTheme?: ThemeMode;
}) {
  const { theme, toggleTheme } = useTheme(userId, initialTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-app p-2 text-app-muted transition hover:bg-surface-hover hover:text-app-fg"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
