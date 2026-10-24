"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the server components on the page (e.g. the sidebar's LiveKit
// lookup) every `seconds`, and whenever the tab regains focus.
export const RefreshOnInterval = ({ seconds = 20 }: { seconds?: number }) => {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    const onFocus = () => router.refresh();

    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, seconds]);

  return null;
};
