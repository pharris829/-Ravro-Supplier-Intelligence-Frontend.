import { useEffect, useState } from "react";
import { getDashboardIntel } from "@/api/getDashboardIntel";

const FALLBACK = {
  scores:     { opportunity: 0, saturation: 0, velocity: 0, reliability: 0 },
  trends:     { opportunity: [], velocity: [], saturation: [] },
  featureGaps: [],
  alerts:     [],
};

export function useDashboardIntel() {
  const [data, setData]       = useState<any>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getDashboardIntel()
      .then((res) => setData(res ?? FALLBACK))
      .catch((err) => setError(err?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
