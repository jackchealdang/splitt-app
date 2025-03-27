"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster() {
  const isDarkMode = document.documentElement.classList.contains("dark");

  return (
    <SonnerToaster
      position="bottom-center"
      swipeDirections={["left", "bottom"]}
      duration={3000}
      theme={isDarkMode ? "dark" : "light"}
    />
  );
}
