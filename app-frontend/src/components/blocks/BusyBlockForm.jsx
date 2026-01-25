import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { busyBlockSchema } from '../../utils/validation';
import Button from '../common/Button';

const BusyBlockForm = ({ onSubmit, initialData, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(busyBlockSchema),
    defaultValues: initialData || {
      title: '',
      startAt: '',
      endAt: '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    reset(initialData || {
      title: '',
      startAt: '',
      endAt: '',
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className={`w-full px-3 py-2 border ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="e.g., DBMS Class, Gym, Meeting"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Start Time */}
      <div>
        <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 mb-1">
          Start Time *
        </label>
        <input
          id="startAt"
          type="datetime-local"
          {...register('startAt')}
          className={`w-full px-3 py-2 border ${
            errors.startAt ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {errors.startAt && (
          <p className="mt-1 text-sm text-red-600">{errors.startAt.message}</p>
        )}
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 mb-1">
          End Time *
        </label>
        <input
          id="endAt"
          type="datetime-local"
          {...register('endAt')}
          className={`w-full px-3 py-2 border ${
            errors.endAt ? 'border-red-300' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {errors.endAt && (
          <p className="mt-1 text-sm text-red-600">{errors.endAt.message}</p>
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
          {initialData ? 'Update Block' : 'Create Block'}
        </Button>
      </div>
    </form>
  );
};

export default BusyBlockForm;
