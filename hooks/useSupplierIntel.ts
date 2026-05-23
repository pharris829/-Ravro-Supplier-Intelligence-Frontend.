import { useEffect, useState } from "react";
import { getSupplierIntel } from "../api/getSupplierIntel";

export function useSupplierIntel(supplierId: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getSupplierIntel(supplierId).then(setData).catch(console.error);
  }, [supplierId]);

  return data;
}
