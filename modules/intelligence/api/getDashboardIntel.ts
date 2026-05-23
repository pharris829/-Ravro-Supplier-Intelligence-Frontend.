import { api } from "@/lib/api-client";
import { DashboardIntel } from "../types/DashboardIntel";

export async function getDashboardIntel(): Promise<DashboardIntel> {
  return api.get("/intelligence/dashboard");
}
