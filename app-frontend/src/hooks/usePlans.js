import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  generatePlan,
  getPlan,
  markBlockDone,
  markBlockMissed
} from '../api/plansApi';
import { TASK_KEYS } from './useTasks';

// Query keys
export const PLAN_KEYS = {
  all: ['plans'],
  lists: () => [...PLAN_KEYS.all, 'list'],
  details: () => [...PLAN_KEYS.all, 'detail'],
  detail: (date) => [...PLAN_KEYS.details(), date],
};

/**
 * Get plan for a specific date
 */
export const usePlan = (date) => {
  return useQuery({
    queryKey: PLAN_KEYS.detail(date),
    queryFn: () => getPlan(date),
    enabled: !!date,
  });
};

/**
 * Generate a new plan
 */
export const useGeneratePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generatePlan,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      
      const unscheduledCount = data.unscheduled?.length || 0;
      const scheduledCount = data.blocks?.length || 0;
      
      if (unscheduledCount > 0) {
        toast.success(`Plan generated! ${scheduledCount} tasks scheduled, ${unscheduledCount} unscheduled.`);
      } else {
        toast.success(`Plan generated successfully! ${scheduledCount} tasks scheduled.`);
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to generate plan';
      toast.error(message);
    },
  });
};

/**
 * Mark a plan block as done
 */
export const useMarkBlockDone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId, markTaskDone }) => markBlockDone(blockId, markTaskDone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      toast.success('Block marked as done!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark block as done';
      toast.error(message);
    },
  });
};

/**
 * Mark a plan block as missed and reschedule
 */
export const useMarkBlockMissed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId, reschedule }) => markBlockMissed(blockId, reschedule),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      
      if (data.blocks && data.blocks.length > 0) {
        toast.success(`Block marked as missed. ${data.blocks.length} remaining blocks rescheduled.`);
      } else {
        toast.success('Block marked as missed.');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark block as missed';
      toast.error(message);
    },
  });
};
