import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getBusyBlocks,
  createBusyBlock,
  deleteBusyBlock
} from '../api/busyBlocksApi';

// Query keys
export const BUSY_BLOCK_KEYS = {
  all: ['busyBlocks'],
  lists: () => [...BUSY_BLOCK_KEYS.all, 'list'],
};

/**
 * Get all busy blocks
 */
export const useBusyBlocks = () => {
  return useQuery({
    queryKey: BUSY_BLOCK_KEYS.lists(),
    queryFn: getBusyBlocks,
  });
};

/**
 * Create a new busy block
 */
export const useCreateBusyBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBusyBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUSY_BLOCK_KEYS.lists() });
      toast.success('Busy block created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create busy block';
      toast.error(message);
    },
  });
};

/**
 * Delete a busy block
 */
export const useDeleteBusyBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBusyBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUSY_BLOCK_KEYS.lists() });
      toast.success('Busy block deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete busy block';
      toast.error(message);
    },
  });
};
