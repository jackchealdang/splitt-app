"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster() {
  const isDarkMode = document.documentElement.classList.contains("dark");

  return <SonnerToaster theme={isDarkMode ? "dark" : "light"} />;
}
