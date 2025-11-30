"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={handleToggle}
      className="relative h-9 w-9 rounded-full bg-secondary/60 text-foreground hover:bg-secondary focus-visible:ring-offset-0"
      disabled={!mounted}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          !mounted || isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          !mounted || !isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
