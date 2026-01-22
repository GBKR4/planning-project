import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  markTaskDone,
  markTaskTodo
} from '../api/tasksApi';

// Query keys
export const TASK_KEYS = {
  all: ['tasks'],
  lists: () => [...TASK_KEYS.all, 'list'],
  list: (filters) => [...TASK_KEYS.lists(), filters],
  details: () => [...TASK_KEYS.all, 'detail'],
  detail: (id) => [...TASK_KEYS.details(), id],
};

/**
 * Get all tasks
 */
export const useTasks = () => {
  return useQuery({
    queryKey: TASK_KEYS.lists(),
    queryFn: getTasks,
  });
};

/**
 * Get a single task by ID
 */
export const useTask = (taskId) => {
  return useQuery({
    queryKey: TASK_KEYS.detail(taskId),
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });
};

/**
 * Create a new task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
    },
  });
};

/**
 * Update a task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }) => updateTask(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
    },
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
    },
  });
};

/**
 * Mark task as done
 */
export const useMarkTaskDone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markTaskDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      toast.success('Task marked as done!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark task as done';
      toast.error(message);
    },
  });
};

/**
 * Mark task as todo
 */
export const useMarkTaskTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markTaskTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      toast.success('Task marked as todo!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark task as todo';
      toast.error(message);
    },
  });
};
