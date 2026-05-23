import { useEffect, useState } from "react";
import { getProductIntel } from "../api/getProductIntel";

export function useProductIntel(productId: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getProductIntel(productId).then(setData).catch(console.error);
  }, [productId]);

  return data;
}
