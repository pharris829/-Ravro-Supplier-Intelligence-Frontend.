import { useEffect, useState } from "react";
import { getCategoryIntel } from "../api/getCategoryIntel";

export function useCategoryIntel(categoryId: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getCategoryIntel(categoryId).then(setData).catch(console.error);
  }, [categoryId]);

  return data;
}
