import type { Viewport } from "next";
import "./site.css";

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      <div className="site">{children}</div>
    </>
  );
}
