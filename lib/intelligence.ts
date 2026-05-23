import { api } from "@/lib/api-client";

export async function getOpportunity() {
  return api.get("/intelligence/opportunity");
}
