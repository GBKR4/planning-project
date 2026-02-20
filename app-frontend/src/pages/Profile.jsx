import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import { useMe, useUpdateProfile } from '../hooks/useUsers';
import { useTasks } from '../hooks/useTasks';
import { useBusyBlocks } from '../hooks/useBusyBlocks';
import { resendVerification } from '../api/authApi';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import showToast from '../utils/toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const Profile = () => {
  const { user: authUser } = useAuth();
  const { data: user, isLoading } = useMe();
  const { data: tasks } = useTasks();
  const { data: busyBlocks } = useBusyBlocks();
  const updateProfileMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Calculate stats
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const totalBusyBlocks = busyBlocks?.length || 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      showToast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification({ email: user?.email });
      showToast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to send verification email');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" className="mt-20" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Rainbow Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-rose-500 rounded-2xl p-8 shadow-2xl mb-6">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white flex items-center space-x-3 drop-shadow-lg">
              <span className="text-5xl animate-bounce">👤</span>
              <span>Profile</span>
            </h1>
            <p className="mt-2 text-white text-lg drop-shadow-md">Manage your account information</p>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-yellow-300 opacity-30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-cyan-300 opacity-30 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-white opacity-20 blur-3xl"></div>
        </div>

        {/* Profile Card with Enhanced Colors */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl border-2 border-purple-200 overflow-hidden">
          {/* Header Section with Avatar and Rainbow Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-rose-600 px-8 py-16">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 opacity-50"></div>
            <div className="relative z-10 flex items-center space-x-8">
              {/* Avatar with Rainbow Glow */}
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-2xl group-hover:scale-110 transition-all duration-300 border-4 border-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
              </div>
              {/* User Info */}
              <div className="text-white">
                <h2 className="text-3xl font-bold drop-shadow-lg">{user?.name}</h2>
                <p className="text-indigo-100 mt-2 text-lg drop-shadow">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-8 py-8 space-y-8">
            {/* Account Information */}
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center space-x-2">
                <span>📝</span>
                <span>Account Information</span>
              </h3>
              
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 bg-white shadow-sm"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-400 bg-white shadow-sm"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" loading={updateProfileMutation.isPending}>
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <p className="text-gray-900 font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-gray-900 font-medium">
                      {user?.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Verification Status */}
            {user?.email_verified !== undefined && (
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 flex items-center space-x-2">
                  <span>✔️</span>
                  <span>Verification Status</span>
                </h3>
                <div className="flex items-center space-x-3">
                  {user.email_verified ? (
                    <span className="px-5 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl text-base font-black shadow-lg hover:scale-110 transition-transform">
                      ✓ Email Verified
                    </span>
                  ) : (
                    <>
                      <span className="px-5 py-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-xl text-base font-black shadow-lg animate-pulse">
                        ⚠ Email Not Verified
                      </span>
                      <button 
                        onClick={handleResendVerification}
                        className="text-base text-purple-600 hover:text-pink-600 font-black underline decoration-2 hover:decoration-pink-600 transition-colors"
                      >
                        Resend verification email
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions with Colorful Buttons */}
            <div className="pt-6 border-t-2 border-purple-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-black shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
                  disabled={isEditing}
                >
                  <span className="text-xl">{isEditing ? '✏️' : '✏️'}</span>
                  <span>{isEditing ? 'Editing...' : 'Edit Profile'}</span>
                </button>
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="px-8 py-4 border-3 border-purple-500 bg-white text-purple-700 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 font-black shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center space-x-2"
                >
                  <span className="text-xl">🔐</span>
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card with Rainbow Colors */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-2xl shadow-2xl border-2 border-purple-200 p-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 flex items-center space-x-2">
            <span className="text-3xl">📊</span>
            <span>Quick Stats</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform">
              <div className="text-6xl font-black text-white drop-shadow-lg">{completedTasks}</div>
              <div className="text-sm font-bold text-white mt-3 drop-shadow">✓ Tasks Completed</div>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform">
              <div className="text-6xl font-black text-white drop-shadow-lg">{tasks?.length || 0}</div>
              <div className="text-sm font-bold text-white mt-3 drop-shadow">📋 Total Tasks</div>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl shadow-xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform">
              <div className="text-6xl font-black text-white drop-shadow-lg">{totalBusyBlocks}</div>
              <div className="text-sm font-bold text-white mt-3 drop-shadow">🚫 Busy Blocks</div>
            </div>
          </div>
        </div>

        {/* Danger Zone with Enhanced Red Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 border-4 border-red-400 rounded-2xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-red-400 opacity-20 blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-3 flex items-center space-x-2">
              <span className="text-3xl">⚠️</span>
              <span>Danger Zone</span>
            </h3>
            <p className="text-base text-red-800 mb-6 font-bold">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={() => setShowDeleteAccount(true)}
              className="px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:via-rose-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 font-black shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
            >
              <span className="text-xl">🗑️</span>
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <DeleteAccountModal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
      />
    </Layout>
  );
};

export default Profile;
