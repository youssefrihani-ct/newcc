import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/i18n/t";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem("cc.theme");
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Light and dark themes from day one (spec 20). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(storedTheme() ?? systemTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <Button
      variant="ghost"
      className="min-w-11 px-2"
      aria-label={theme === "dark" ? t("Switch to light theme") : t("Switch to dark theme")}
      onClick={() => {
        setTheme(next);
        try {
          localStorage.setItem("cc.theme", next);
        } catch {
          // storage unavailable: the choice lasts for this page only
        }
      }}
    >
      {theme === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </Button>
  );
}
