import { api } from "@/lib/api-client";
import { CategoryIntel } from "../types/CategoryIntel";

export async function getCategoryIntel(id: string): Promise<CategoryIntel> {
  return api.get(`/categories/${id}/intelligence`);
}
