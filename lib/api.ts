export const api = {
  get: async (path: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`);
    if (!res.ok) throw new Error("API error");
    return res.json();
  },
};
