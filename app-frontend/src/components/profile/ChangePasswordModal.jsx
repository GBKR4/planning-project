import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import Button from '../common/Button';
import showToast from '../../utils/toast';
import { changePassword } from '../../api/usersApi';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { score: 0, label: '', color: 'bg-gray-200' },
    { score: 1, label: 'Weak', color: 'bg-gray-400' },
    { score: 2, label: 'Fair', color: 'bg-gray-500' },
    { score: 3, label: 'Good', color: 'bg-gray-600' },
    { score: 4, label: 'Strong', color: 'bg-gray-700' },
    { score: 5, label: 'Very Strong', color: 'bg-gray-900' },
  ];

  return levels.find((level) => level.score === Math.min(score, 5));
};

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const newPassword = watch('newPassword', '');
  const passwordStrength = getPasswordStrength(newPassword);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      showToast.success('Password changed successfully');
      reset();
      onClose();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to change password');
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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Change Password</Dialog.Title>
            <button onClick={handleClose} className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
              <MdClose className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...register('currentPassword')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-gray-500"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showCurrentPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-gray-500"
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showNewPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className={`h-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-gray-500"
                  placeholder="Confirm new password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showConfirmPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">Change Password</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
