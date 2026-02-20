import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema } from '../../utils/validation';
import Button from '../common/Button';
import { TASK_PRIORITY, TIME_PREFERENCE, TIME_PREFERENCE_LABELS } from '../../utils/constants';

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
      timePreference: initialData.time_preference || 'anytime',
    } : {
      title: '',
      notes: '',
      estimatedMinutes: 30,
      deadlineAt: '',
      priority: 3,
      timePreference: 'anytime',
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
      timePreference: initialData.time_preference || 'anytime',
    } : {
      title: '',
      notes: '',
      estimatedMinutes: 30,
      deadlineAt: '',
      priority: 3,
      timePreference: 'anytime',
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="group">
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-indigo-600">✨</span>
          Task Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`w-full px-4 py-3 border-2 transition-all duration-200 ${
            errors.title 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
          } rounded-xl focus:outline-none focus:ring-4 bg-white shadow-sm hover:shadow-md`}
          placeholder="e.g., Complete project proposal"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="group">
        <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-indigo-600">📝</span>
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md resize-none"
          placeholder="Add any additional details or notes..."
        />
        {errors.notes && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {errors.notes.message}
          </p>
        )}
      </div>

      {/* Estimated Minutes & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="group">
          <label htmlFor="estimatedMinutes" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">⏱️</span>
            Duration (minutes) *
          </label>
          <input
            id="estimatedMinutes"
            type="number"
            {...register('estimatedMinutes', { valueAsNumber: true })}
            className={`w-full px-4 py-3 border-2 transition-all duration-200 ${
              errors.estimatedMinutes 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
            } rounded-xl focus:outline-none focus:ring-4 bg-white shadow-sm hover:shadow-md`}
            placeholder="30"
          />
          {errors.estimatedMinutes && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span>
              {errors.estimatedMinutes.message}
            </p>
          )}
        </div>

        <div className="group">
          <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-indigo-600">🎯</span>
            Priority *
          </label>
          <select
            id="priority"
            {...register('priority', { valueAsNumber: true })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
          >
            <option value={1}>⚪ 1 - Low</option>
            <option value={2}>🔵 2 - Medium</option>
            <option value={3}>🟢 3 - Normal</option>
            <option value={4}>🟠 4 - High</option>
            <option value={5}>🔴 5 - Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span>
              {errors.priority.message}
            </p>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div className="group">
        <label htmlFor="deadlineAt" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-indigo-600">📅</span>
          Deadline
        </label>
        <input
          id="deadlineAt"
          type="datetime-local"
          {...register('deadlineAt')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
        />
        {errors.deadlineAt && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {errors.deadlineAt.message}
          </p>
        )}
      </div>

      {/* Time Preference */}
      <div className="group">
        <label htmlFor="timePreference" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-indigo-600">🕐</span>
          Time Preference
        </label>
        <select
          id="timePreference"
          {...register('timePreference')}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200 bg-white shadow-sm hover:shadow-md cursor-pointer"
        >
          <option value="anytime">⏰ Anytime - Flexible scheduling</option>
          <option value="morning">🌅 Morning - Before 2:00 PM</option>
          <option value="evening">🌆 Evening - After 2:00 PM</option>
        </select>
        {errors.timePreference && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {errors.timePreference.message}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500 italic flex items-center gap-1">
          <span>💡</span>
          Choose when you work best for optimal productivity
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-6">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            {initialData ? '✅ Update Task' : '✨ Create Task'}
          </span>
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
