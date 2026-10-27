"use client";

import { useEffect } from "react";
import { initializeHomeReveals } from "./home-reveal";

export function HomeMotion() {
  useEffect(() => {
    const root = document.getElementById("main-content");
    if (root) return initializeHomeReveals(root);
  }, []);
  return null;
}
