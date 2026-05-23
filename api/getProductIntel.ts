import { api } from "@/lib/api-client";

export async function getProductIntel(productId: string) {
  return api.get(`/products/${productId}/intelligence`);
}
