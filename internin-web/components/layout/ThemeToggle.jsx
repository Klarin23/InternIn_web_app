"use client";

import { FiSun, FiMoon } from "react-icons/fi";
import { useThemeStore } from "@/lib/store/useThemeStore";

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const estSombre = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={estSombre ? "Passer en mode clair" : "Passer en mode sombre"}
      title={estSombre ? "Mode clair" : "Mode sombre"}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
    >
      {estSombre ? (
        <FiMoon className="h-[18px] w-[18px]" />
      ) : (
        <FiSun className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}