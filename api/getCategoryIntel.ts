import { api } from "@/lib/api-client";

export async function getCategoryIntel(categoryId: string) {
  return api.get(`/categories/${categoryId}/intelligence`);
}
