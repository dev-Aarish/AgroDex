/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getDashboardHealth } from "@/lib/api";

interface HealthCheckResponse {
  ok: boolean;
  status: {
    hedera?: { ok: boolean };
    ai?: { ok: boolean };
    [key: string]: any;
  };
}

const fetchHealth = async (): Promise<HealthCheckResponse> => {
  const data = await getDashboardHealth();

  if (!data.ok) {
    throw new Error("Health check failed");
  }

  // Vérifie si tous les services sont 'ok'
  const allOk = Object.values(data.status || {}).every((s: any) => s?.ok);
  if (!allOk) {
    throw new Error("One or more services are down");
  }

  return { ok: data.ok, status: data.status };
};

export const useServiceStatus = (enabled = true) => {
  return useQuery({
    queryKey: ["serviceHealth"],
    queryFn: fetchHealth,
    enabled,
    // Ping toutes les 60 secondes en arrière-plan
    refetchInterval: 60000,
    // Ne pas réessayer en cas d'erreur (pour que le point reste rouge)
    retry: false,
    // Ne pas refetcher au focus de la fenêtre (pour éviter les spams)
    refetchOnWindowFocus: false,
  });
};
