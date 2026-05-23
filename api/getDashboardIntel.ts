import { api } from "@/lib/api-client";

export async function getDashboardIntel() {
  return api.get("/intelligence/dashboard");
}
