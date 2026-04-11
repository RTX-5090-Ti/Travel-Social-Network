import { useEffect, useMemo, useState } from "react";

import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "travel-social-theme-mode";

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialThemeMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "system") {
    return stored;
  }

  return "system";
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getInitialThemeMode() === "system" ? getSystemTheme() : getInitialThemeMode(),
  );

  useEffect(() => {
    if (themeMode !== "system") {
      setResolvedTheme(themeMode);
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    return () => mediaQuery.removeEventListener("change", syncTheme);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.themeMode = themeMode;
    body.dataset.themeMode = themeMode;
    root.dataset.theme = resolvedTheme;
    body.dataset.theme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    body.classList.toggle("dark", resolvedTheme === "dark");
    window.localStorage.setItem(STORAGE_KEY, themeMode);
  }, [resolvedTheme, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [resolvedTheme, themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
