import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconWallet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /><path d="M6 6V5a2 2 0 0 1 2-2h8" /></svg>
);
export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></svg>
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5" /><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18.5 14.8c1.6.8 2.7 2.6 3 5.2" /></svg>
);
export const IconScissors = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="6" cy="6" r="2.8" /><circle cx="6" cy="18" r="2.8" /><path d="M8.3 7.7 20 18M8.3 16.3 20 6" /></svg>
);
export const IconReceipt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>
);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></svg>
);
export const IconImage = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const IconCash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></svg>
);
export const IconWhatsApp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, strokeWidth: 1.7 })}><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.6z" /><path d="M9 8.5c0 3.5 2.6 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.4-1.6-2.8-2.8l.9-1-1-2-1.6 1z" /></svg>
);
export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></svg>
);
export const IconGlobe = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></svg>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4" /></svg>
);
