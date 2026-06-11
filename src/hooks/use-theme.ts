"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThemeMode } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import { updateProfileTheme } from "@/lib/portfolio-db";

export function useTheme(userId?: string, initialTheme?: ThemeMode) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme ?? "dark");

  useEffect(() => {
    const applied =
      (document.documentElement.getAttribute("data-theme") as ThemeMode) ||
      initialTheme ||
      "dark";
    setTheme(applied);
    document.documentElement.setAttribute("data-theme", applied);
  }, [initialTheme]);

  const setThemeMode = useCallback(
    (next: ThemeMode) => {
      setTheme(next);
      document.documentElement.setAttribute("data-theme", next);
      if (userId) {
        const supabase = createClient();
        updateProfileTheme(supabase, userId, next).catch(console.error);
      }
    },
    [userId],
  );

  const toggleTheme = useCallback(() => {
    setThemeMode(theme === "dark" ? "light" : "dark");
  }, [theme, setThemeMode]);

  return { theme, setThemeMode, toggleTheme };
}
