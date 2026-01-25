import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import showToast from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { deleteAccount } from '../../api/usersApi';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
});

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await deleteAccount({ password: data.password });
      showToast.success('Account deleted successfully');
      logout();
      reset();
      onClose();
      navigate('/login');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-red-600">
              Delete Account
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Warning */}
          <div className="p-6 bg-red-50 border-b border-red-100">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  This action cannot be undone
                </h4>
                <p className="text-sm text-red-700">
                  Deleting your account will permanently remove all your data, including:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All your tasks and schedules</li>
                  <li>All your busy blocks</li>
                  <li>All generated plans</li>
                  <li>Your profile information</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Your Password
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmation Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                {...register('confirmation')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Type DELETE"
              />
              {errors.confirmation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmation.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                Delete Account
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
