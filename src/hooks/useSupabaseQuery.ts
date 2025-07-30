import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logQueryPerformance } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';

// Custom hook for Supabase queries with caching and error handling
export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...key, user?.id],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const result = await queryFn();
        logQueryPerformance(key.join('-'), startTime);
        return result;
      } catch (error) {
        logQueryPerformance(`${key.join('-')}-error`, startTime);
        throw error;
      }
    },
    enabled: !!user && (options?.enabled !== false),
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    cacheTime: options?.cacheTime || 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 3;
    }
  });
};

// Custom hook for Supabase mutations with optimistic updates
export const useSupabaseMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: any, variables: V) => any;
    };
  }
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (variables: V) => {
      const startTime = Date.now();
      try {
        const result = await mutationFn(variables);
        logQueryPerformance('mutation', startTime);
        return result;
      } catch (error) {
        logQueryPerformance('mutation-error', startTime);
        throw error;
      }
    },
    onMutate: async (variables: V) => {
      // Optimistic update
      if (options?.optimisticUpdate) {
        const { queryKey, updateFn } = options.optimisticUpdate;
        await queryClient.cancelQueries({ queryKey: [...queryKey, user?.id] });
        
        const previousData = queryClient.getQueryData([...queryKey, user?.id]);
        
        queryClient.setQueryData([...queryKey, user?.id], (old: any) => 
          updateFn(old, variables)
        );
        
        return { previousData };
      }
    },
    onError: (error: any, variables: V, context: any) => {
      // Rollback optimistic update
      if (context?.previousData && options?.optimisticUpdate) {
        queryClient.setQueryData(
          [...options.optimisticUpdate.queryKey, user?.id], 
          context.previousData
        );
      }
      
      console.error('Mutation error:', error);
      showToast(
        error.message || 'An error occurred. Please try again.',
        'error'
      );
      
      options?.onError?.(error, variables);
    },
    onSuccess: (data: T, variables: V) => {
      // Invalidate and refetch related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [...queryKey, user?.id] });
        });
      }
      
      showToast('Operation completed successfully!', 'success');
      options?.onSuccess?.(data, variables);
    }
  });
};

// Pagination hook
export const usePaginatedQuery = <T>(
  key: string[],
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; count: number }>,
  pageSize: number = 20
) => {
  const { user } = useAuth();
  const [page, setPage] = React.useState(0);

  const query = useQuery({
    queryKey: [...key, user?.id, page, pageSize],
    queryFn: () => queryFn(page, pageSize),
    enabled: !!user,
    keepPreviousData: true
  });

  return {
    ...query,
    page,
    setPage,
    hasNextPage: query.data ? (page + 1) * pageSize < query.data.count : false,
    hasPreviousPage: page > 0
  };
};