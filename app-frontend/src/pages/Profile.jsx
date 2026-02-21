import { useState, useRef } from 'react';
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
import { uploadProfilePhoto, deleteProfilePhoto } from '../api/usersApi';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import showToast from '../utils/toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const Profile = () => {
  const { user: authUser } = useAuth();
  const { data: user, isLoading, refetch } = useMe();
  const { data: tasks } = useTasks();
  const { data: busyBlocks } = useBusyBlocks();
  const updateProfileMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    try {
      setIsUploadingPhoto(true);
      await uploadProfilePhoto(selectedPhoto);
      await refetch(); // Refresh user data
      showToast.success('Profile photo updated successfully!');
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      await deleteProfilePhoto();
      await refetch(); // Refresh user data
      showToast.success('Profile photo deleted successfully!');
      setPhotoPreview(null);
      setSelectedPhoto(null);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  const handleCancelPhotoUpload = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProfilePhotoUrl = () => {
    if (photoPreview) return photoPreview;
    if (user?.profile_photo) return `http://localhost:5000${user.profile_photo}`;
    return null;
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
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Header with Enhanced Design */}
        <div className="relative z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 backdrop-blur-lg rounded-3xl shadow-3xl border-3 border-purple-300 p-10 hover:border-pink-400 hover:shadow-3xl transition-all duration-300">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center space-x-4">
            <span className="text-6xl animate-float">👤</span>
            <span>Profile</span>
          </h1>
          <p className="mt-3 text-gray-600 text-xl font-semibold">Manage your account information</p>
        </div>

        {/* Profile Card with Glassmorphism */}
        <div className="relative z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-lg rounded-3xl shadow-3xl border-4 border-purple-400 overflow-hidden hover:border-pink-400 hover:shadow-3xl transition-all duration-300">
          {/* Header Section with Avatar */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 px-10 py-20">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/40 via-pink-500/40 to-rose-500/40"></div>
            <div className="relative z-10 flex items-center space-x-10">
              {/* Avatar with Float Animation and Photo Upload */}
              <div className="relative group">
                {getProfilePhotoUrl() ? (
                  <div className="relative">
                    <img
                      src={getProfilePhotoUrl()}
                      alt={user?.name}
                      className="w-40 h-40 rounded-full object-cover shadow-3xl group-hover:scale-110 transition-all duration-300 border-4 border-white animate-float ring-4 ring-purple-400/50 group-hover:ring-pink-400/70"
                    />
                    {/* Decorative gradient ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md"></div>
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 rounded-full flex items-center justify-center text-7xl font-black text-white shadow-3xl group-hover:scale-110 transition-all duration-300 border-4 border-white animate-float ring-4 ring-purple-400/50 group-hover:ring-pink-400/70">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                
                {/* Photo Upload/Delete Buttons */}
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="profile-photo-input"
                  />
                  <label
                    htmlFor="profile-photo-input"
                    className="cursor-pointer bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:scale-125 transition-all duration-300 border-3 border-white hover:rotate-12 group/btn"
                    title="Upload photo"
                  >
                    <span className="text-2xl group-hover/btn:scale-110 inline-block transition-transform">📷</span>
                  </label>
                  {(user?.profile_photo || photoPreview) && (
                    <button
                      onClick={handlePhotoDelete}
                      className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700 text-white p-4 rounded-full shadow-2xl hover:scale-125 transition-all duration-300 border-3 border-white hover:-rotate-12 group/btn"
                      title="Delete photo"
                    >
                      <span className="text-2xl group-hover/btn:scale-110 inline-block transition-transform">🗑️</span>
                    </button>
                  )}
                </div>
              </div>
              {/* User Info */}
              <div className="text-white">
                <h2 className="text-4xl font-black drop-shadow-lg">{user?.name}</h2>
                <p className="text-blue-100 mt-3 text-xl drop-shadow font-semibold">{user?.email}</p>
              </div>
            </div>
            
            {/* Photo Upload Confirmation */}
            {selectedPhoto && (
              <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-lg rounded-3xl p-8 border-3 border-gradient-to-r from-blue-400 to-purple-500 animate-fadeIn shadow-2xl">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-purple-400 opacity-20 blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-blue-400 opacity-20 blur-3xl animate-blob animation-delay-2000"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl animate-float">
                      <span className="text-4xl">📸</span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-black text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">New photo selected!</p>
                      <p className="text-gray-600 font-semibold text-sm mt-1">Ready to upload your profile picture?</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 font-black shadow-2xl hover:shadow-3xl hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                      {isUploadingPhoto ? (
                        <span className="flex items-center justify-center space-x-2">
                          <span className="animate-spin">⟳</span>
                          <span>Uploading...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-2">
                          <span className="text-2xl">✓</span>
                          <span>Upload Photo</span>
                        </span>
                      )}
                    </button>
                    <button
                      onClick={handleCancelPhotoUpload}
                      disabled={isUploadingPhoto}
                      className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border-3 border-gray-300 hover:border-gray-400 rounded-2xl transition-all duration-300 font-black shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">✗</span>
                        <span>Cancel</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="px-10 py-10 space-y-10">
            {/* Account Information */}
            <div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 flex items-center space-x-3">
                <span className="text-4xl animate-float">📝</span>
                <span>Account Information</span>
              </h3>
              
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
                        <span className="text-lg">👤</span>
                        <span>Name</span>
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className="w-full px-5 py-4 border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 hover:border-purple-400 bg-gray-50 hover:bg-white font-semibold shadow-sm hover:shadow-md"
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600 font-semibold">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center space-x-2">
                        <span className="text-lg">📧</span>
                        <span>Email</span>
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-5 py-4 border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 hover:border-purple-400 bg-gray-50 hover:bg-white font-semibold shadow-sm hover:shadow-md"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600 font-semibold">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" loading={updateProfileMutation.isPending}>
                      Save Changes
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                      <span className="text-lg">👤</span>
                      <span>Name</span>
                    </label>
                    <p className="text-gray-900 font-bold text-lg">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                      <span className="text-lg">📧</span>
                      <span>Email</span>
                    </label>
                    <p className="text-gray-900 font-bold text-lg">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <span>Account Created</span>
                    </label>
                    <p className="text-gray-900 font-bold text-lg">
                      {user?.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Verification Status */}
            {user?.email_verified !== undefined && (
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-8 flex items-center space-x-3">
                  <span className="text-4xl animate-float">✔️</span>
                  <span>Verification Status</span>
                </h3>
                <div className="flex items-center space-x-4">
                  {user.email_verified ? (
                    <span className="px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl text-lg font-black shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                      ✓ Email Verified
                    </span>
                  ) : (
                    <>
                      <span className="px-8 py-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-2xl text-lg font-black shadow-2xl animate-pulse">
                        ⚠ Email Not Verified
                      </span>
                      <button 
                        onClick={handleResendVerification}
                        className="text-lg text-purple-600 hover:text-pink-600 font-black underline decoration-2 hover:decoration-pink-600 transition-colors hover:scale-105 transform"
                      >
                        Resend verification email
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Actions with Enhanced Buttons */}
            <div className="pt-8 border-t-3 border-purple-300">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 font-black shadow-2xl hover:shadow-3xl hover:-translate-y-1 hover:scale-105 flex items-center space-x-3 text-lg"
                  disabled={isEditing}
                >
                  <span className="text-2xl animate-float">{isEditing ? '✏️' : '✏️'}</span>
                  <span>{isEditing ? 'Editing...' : 'Edit Profile'}</span>
                </button>
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="px-10 py-5 border-3 border-purple-500 bg-white text-purple-700 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 font-black shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105 flex items-center space-x-3 text-lg"
                >
                  <span className="text-2xl animate-float">🔐</span>
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card with Glassmorphism */}
        <div className="relative z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-lg rounded-3xl shadow-3xl border-3 border-purple-300 p-10 hover:border-pink-400 hover:shadow-3xl transition-all duration-300">
          <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-10 flex items-center space-x-3">
            <span className="text-4xl animate-float">📊</span>
            <span>Quick Stats</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl shadow-2xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform border-2 border-blue-300">
              <div className="text-7xl font-black text-white drop-shadow-lg">{completedTasks}</div>
              <div className="text-base font-bold text-white mt-4 drop-shadow">✓ Tasks Completed</div>
            </div>
            <div className="text-center p-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform border-2 border-purple-300">
              <div className="text-7xl font-black text-white drop-shadow-lg">{tasks?.length || 0}</div>
              <div className="text-base font-bold text-white mt-4 drop-shadow">📋 Total Tasks</div>
            </div>
            <div className="text-center p-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-3xl shadow-2xl hover:scale-110 hover:rotate-3 transition-all duration-300 transform border-2 border-orange-300">
              <div className="text-7xl font-black text-white drop-shadow-lg">{totalBusyBlocks}</div>
              <div className="text-base font-bold text-white mt-4 drop-shadow">🚫 Busy Blocks</div>
            </div>
          </div>
        </div>

        {/* Danger Zone with Glassmorphism */}
        <div className="relative z-10 overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 backdrop-blur-lg border-4 border-red-400 hover:border-rose-500 rounded-3xl p-10 shadow-3xl hover:shadow-3xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-red-400 opacity-20 blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-pink-400 opacity-20 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4 flex items-center space-x-3">
              <span className="text-4xl animate-float">⚠️</span>
              <span>Danger Zone</span>
            </h3>
            <p className="text-lg text-red-800 mb-8 font-bold">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={() => setShowDeleteAccount(true)}
              className="px-10 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:via-rose-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 font-black shadow-2xl hover:shadow-3xl hover:-translate-y-1 hover:scale-105 flex items-center space-x-3 text-lg"
            >
              <span className="text-2xl animate-float">🗑️</span>
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
