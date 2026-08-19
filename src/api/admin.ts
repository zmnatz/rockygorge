import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/api';

export function fetchAdminData(endpoint: string): Promise<unknown> {
  return get<unknown>(`/.netlify/functions/${endpoint}`);
}

export function useAdminData(endpoint: string, initialData?: unknown) {
  return useQuery({
    queryKey: ['admin', endpoint],
    queryFn: () => fetchAdminData(endpoint),
    initialData,
    staleTime: Infinity,
  });
}
