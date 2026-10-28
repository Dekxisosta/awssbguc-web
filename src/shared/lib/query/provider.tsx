"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is treated as fresh for 30s: switching tabs shows the cache instantly,
        // then quietly revalidates once it goes stale.
        staleTime: 30_000,
        // Unused cache entries are kept for 5 minutes before garbage collection.
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/** One client per browser session (so the cache survives navigation); a fresh one per request on the server. */
function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Renders nothing in production builds. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
