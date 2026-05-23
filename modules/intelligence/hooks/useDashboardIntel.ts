import { useEffect, useState } from "react";
import { getDashboardIntel } from "@/api/getDashboardIntel";

export function useDashboardIntel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardIntel()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
