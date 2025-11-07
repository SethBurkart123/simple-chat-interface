"use client";

import { ThemeProvider } from "@/contexts/theme-context";
import { Suspense } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Suspense fallback={<></>}>
        {children}
      </Suspense>
    </ThemeProvider>
  );
}

