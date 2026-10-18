import type { Viewport } from "next";
import "./site.css";

export const viewport: Viewport = { themeColor: "#0e0c0a" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <div className="site">{children}</div>
    </>
  );
}
