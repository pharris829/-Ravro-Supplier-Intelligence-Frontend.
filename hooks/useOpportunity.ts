import { useEffect, useState } from "react";
import { getOpportunity } from "../api/getOpportunity";

export function useOpportunity() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getOpportunity().then(setData).catch(console.error);
  }, []);

  return data;
}
