"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <html lang="en" className="dark">
      <head>
        <title>Restaurant Management & Ordering System</title>
        <meta name="description" content="Multi-branch restaurant ordering, kitchen dispatch, and management platform" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
