import { api } from "@/lib/api-client";

export async function getSupplierIntel(supplierId: string) {
  return api.get(`/suppliers/${supplierId}/intelligence`);
}
