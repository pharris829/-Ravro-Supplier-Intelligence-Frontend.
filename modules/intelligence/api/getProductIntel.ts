import { api } from "@/lib/api-client";
import { ProductIntel } from "../types/ProductIntel";

export async function getProductIntel(id: string): Promise<ProductIntel> {
  return api.get(`/api/v1/intelligence/products/${id}`);
}
