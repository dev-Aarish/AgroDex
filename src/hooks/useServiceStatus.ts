/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getDashboardHealth } from "@/lib/api";

interface HealthCheckResponse {
  ok: boolean;
  status: {
    supabase?: { ok: boolean; ms?: number; error?: string };
    hedera?: { ok: boolean; ms?: number; error?: string };
    gemini?: { ok: boolean; ms?: number; error?: string };
    [key: string]: any;
  };
}

const fetchHealth = async (): Promise<HealthCheckResponse> => {
  const data = await getDashboardHealth();

  if (!data.ok) {
    throw new Error("One or more services are down");
  }

  return { ok: data.ok, status: data.status };
};

export const useServiceStatus = (enabled = true) => {
  return useQuery({
    queryKey: ["serviceHealth"],
    queryFn: fetchHealth,
    enabled,
    // Poll every 5 minutes in the background
    refetchInterval: 300_000,
    // Retry up to 2 times on failure, then stop
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Keep stale data visible while refetching
    staleTime: 240_000,
  });
};
