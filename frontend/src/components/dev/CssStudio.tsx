"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __cssStudioStarted?: boolean;
  }
}

export function CssStudio() {
  useEffect(() => {
    // CSS Studio mutates the document outside React. Keep it opt-in so normal
    // local development and automated QA do not inherit its React warnings.
    if (
      process.env.NODE_ENV !== "development" ||
      process.env.NEXT_PUBLIC_ENABLE_CSS_STUDIO !== "true" ||
      window.__cssStudioStarted
    ) {
      return;
    }
    window.__cssStudioStarted = true;

    void import("cssstudio")
      .then(({ startStudio }) => startStudio())
      .catch(() => {
        window.__cssStudioStarted = false;
      });
  }, []);

  return null;
}
