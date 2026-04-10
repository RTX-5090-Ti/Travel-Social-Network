import { useEffect, useMemo, useState } from "react";

import { ThemeContext } from "./theme-context";

const STORAGE_KEY = "travel-social-theme-mode";

function getInitialThemeMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return "light";
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.theme = themeMode;
    body.dataset.theme = themeMode;
    root.classList.toggle("dark", themeMode === "dark");
    body.classList.toggle("dark", themeMode === "dark");
    window.localStorage.setItem(STORAGE_KEY, themeMode);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme: themeMode,
      setThemeMode,
    }),
    [themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
