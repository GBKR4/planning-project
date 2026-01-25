import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema } from '../../utils/validation';
import Button from '../common/Button';
import { TASK_PRIORITY } from '../../utils/constants';

const TaskForm = ({ onSubmit, initialData, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData ? {
      title: initialData.title || '',
      notes: initialData.notes || '',
      estimatedMinutes: initialData.estimated_minutes || 30,
      deadlineAt: initialData.deadline_at || '',
      priority: initialData.priority || 3,
    } : {
      title: '',
      notes: '',
      estimatedMinutes: 30,
      deadlineAt: '',
      priority: 3,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    reset(initialData ? {
      title: initialData.title || '',
      notes: initialData.notes || '',
      estimatedMinutes: initialData.estimated_minutes || 30,
      deadlineAt: initialData.deadline_at || '',
      priority: initialData.priority || 3,
    } : {
      title: '',
      notes: '',
      estimatedMinutes: 30,
      deadlineAt: '',
      priority: 3,
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`w-full px-3 py-2 border ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="Enter task title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Add notes or description"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Estimated Minutes & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes) *
          </label>
          <input
            id="estimatedMinutes"
            type="number"
            {...register('estimatedMinutes', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border ${
              errors.estimatedMinutes ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="30"
          />
          {errors.estimatedMinutes && (
            <p className="mt-1 text-sm text-red-600">{errors.estimatedMinutes.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            {...register('priority', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>1 - Low</option>
            <option value={2}>2 - Medium</option>
            <option value={3}>3 - Normal</option>
            <option value={4}>4 - High</option>
            <option value={5}>5 - Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="deadlineAt" className="block text-sm font-medium text-gray-700 mb-1">
          Deadline
        </label>
        <input
          id="deadlineAt"
          type="datetime-local"
          {...register('deadlineAt')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.deadlineAt && (
          <p className="mt-1 text-sm text-red-600">{errors.deadlineAt.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
