import { api } from "@/lib/api-client";
import { SupplierIntel } from "../types/SupplierIntel";

export async function getSupplierIntel(id: string): Promise<SupplierIntel> {
  return api.get(`/suppliers/${id}/intelligence`);
}
