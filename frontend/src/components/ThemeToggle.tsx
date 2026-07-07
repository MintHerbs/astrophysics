"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* storage may be unavailable; the attribute still applies for this session */
      }
      return next;
    });
  }, []);

  // Before mount, render a neutral icon so the server and client markup match.
  const icon = !mounted ? "brightness_medium" : theme === "dark" ? "dark_mode" : "light_mode";
  const label = !mounted
    ? "Toggle theme"
    : theme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme";

  return (
    <button type="button" className="btn-icon" onClick={toggle} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}
