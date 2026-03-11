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
 * Get all busy blocks, optionally filtered by date (client-side)
 * @param {string} [date] - Optional date string 'YYYY-MM-DD' to filter blocks
 */
export const useBusyBlocks = (date) => {
  return useQuery({
    queryKey: date ? [...BUSY_BLOCK_KEYS.lists(), date] : BUSY_BLOCK_KEYS.lists(),
    queryFn: async () => {
      const blocks = await getBusyBlocks();
      if (!date) return blocks;
      return blocks.filter((block) => {
        const blockDate = new Date(block.start_at).toISOString().slice(0, 10);
        return blockDate === date;
      });
    },
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
