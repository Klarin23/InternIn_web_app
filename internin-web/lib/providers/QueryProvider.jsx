"use client";
// Fournit le QueryClient de TanStack Query à toute l'application.
// Un seul QueryClient par session utilisateur (useState évite d'en recréer
// un à chaque re-render du composant).

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute avant de considérer les données "périmées"
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
