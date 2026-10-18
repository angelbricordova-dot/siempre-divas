"use client";

import { useEffect } from "react";

/** Al tocar un enlace #cat-3, abre ese desplegable de precios. */
export function OpenHashDetails() {
  useEffect(() => {
    const open = () => {
      const el = location.hash ? document.getElementById(location.hash.slice(1)) : null;
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
