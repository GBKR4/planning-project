import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { MdClose, MdWarningAmber } from 'react-icons/md';
import Button from '../common/Button';
import showToast from '../../utils/toast';
import useAuthStore from '../../store/authStore';
import { deleteAccount } from '../../api/usersApi';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.string().refine((value) => value === 'DELETE', {
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
  } = useForm({ resolver: zodResolver(deleteAccountSchema) });

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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Delete Account</Dialog.Title>
            <button onClick={handleClose} className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
              <MdClose className="text-xl" />
            </button>
          </div>

          <div className="border-b border-gray-200 bg-gray-50 p-5">
            <div className="flex gap-3">
              <MdWarningAmber className="mt-0.5 shrink-0 text-2xl text-gray-700" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">This action cannot be undone</h4>
                <p className="mt-1 text-sm text-gray-600">Deleting your account permanently removes tasks, busy blocks, plans, and profile data.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Your Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-gray-500"
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type DELETE to confirm</label>
              <input
                type="text"
                {...register('confirmation')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-colors focus:border-gray-500"
                placeholder="DELETE"
              />
              {errors.confirmation && <p className="mt-1 text-sm text-red-600">{errors.confirmation.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1 !bg-red-600 hover:!bg-red-700 text-white">Delete Account</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
