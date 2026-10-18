"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-EC">
      <body>
        <ErrorScreen {...props} />
      </body>
    </html>
  );
}
