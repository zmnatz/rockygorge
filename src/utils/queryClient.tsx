import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0];
        const params = queryKey.length > 1 ? queryKey.slice(1).join('&') : '';
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return await response.json();
      }
    }
  }
})