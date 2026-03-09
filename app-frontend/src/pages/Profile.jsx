import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  MdDeleteOutline,
  MdEdit,
  MdEmail,
  MdLockOutline,
  MdOutlinePhotoCamera,
  MdPersonOutline,
  MdRefresh,
  MdSave,
} from 'react-icons/md';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import DeleteAccountModal from '../components/profile/DeleteAccountModal';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import { useMe, useUpdateProfile } from '../hooks/useUsers';
import { useTasks } from '../hooks/useTasks';
import { useBusyBlocks } from '../hooks/useBusyBlocks';
import { resendVerification } from '../api/authApi';
import { uploadProfilePhoto, deleteProfilePhoto } from '../api/usersApi';
import showToast from '../utils/toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const StatCard = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

const Profile = () => {
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

  const completedTasks = tasks?.filter((task) => task.status === 'done').length || 0;
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
      showToast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification({ email: user?.email });
      showToast.success('Verification email sent');
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to send verification email');
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    try {
      setIsUploadingPhoto(true);
      await uploadProfilePhoto(selectedPhoto);
      await refetch();
      showToast.success('Profile photo updated successfully');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      await deleteProfilePhoto();
      await refetch();
      showToast.success('Profile photo deleted successfully');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete photo');
    }
  };

  const handleCancelEdit = () => {
    reset();
    setIsEditing(false);
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
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your account information, preferences, and security settings.</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col items-center lg:w-72">
              <div className="relative">
                {getProfilePhotoUrl() ? (
                  <img
                    src={getProfilePhotoUrl()}
                    alt={user?.name}
                    className="h-36 w-36 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-5xl font-semibold text-gray-700">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="profile-photo-input" />

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label
                  htmlFor="profile-photo-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <MdOutlinePhotoCamera className="text-lg" />
                  Change Photo
                </label>
                {(user?.profile_photo || photoPreview) && (
                  <button
                    onClick={handlePhotoDelete}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <MdDeleteOutline className="text-lg" />
                    Remove
                  </button>
                )}
              </div>

              {selectedPhoto && (
                <div className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-sm font-medium text-gray-900">New photo selected</p>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={handlePhotoUpload} loading={isUploadingPhoto} className="flex-1">
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{user?.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                  <p className="mt-3 text-sm text-gray-500">
                    Joined {user?.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing((value) => !value)}
                    disabled={isEditing}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdEdit className="text-lg" />
                    {isEditing ? 'Editing' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <MdLockOutline className="text-lg" />
                    Change Password
                  </button>
                </div>
              </div>

              {user?.email_verified !== undefined && (
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {user.email_verified ? 'Email verified' : 'Email verification pending'}
                  </p>
                  {!user.email_verified && (
                    <button
                      onClick={handleResendVerification}
                      className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900"
                    >
                      <MdRefresh className="text-base" />
                      Resend verification email
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
          <div className="mt-6">
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MdPersonOutline className="text-lg" />
                      Name
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition-colors focus:border-gray-500"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MdEmail className="text-lg" />
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition-colors focus:border-gray-500"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" loading={updateProfileMutation.isPending}>
                    <span className="inline-flex items-center gap-2"><MdSave className="text-lg" />Save Changes</span>
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Created</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {user?.created_at ? format(new Date(user.created_at), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Completed Tasks" value={completedTasks} />
          <StatCard label="Total Tasks" value={tasks?.length || 0} />
          <StatCard label="Busy Blocks" value={totalBusyBlocks} />
        </section>

        <NotificationPreferences />

        <section className="rounded-2xl border border-gray-300 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900">Danger Zone</h3>
          <p className="mt-2 text-sm text-gray-600">Deleting your account permanently removes all planning data.</p>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            <MdDeleteOutline className="text-lg" />
            Delete Account
          </button>
        </section>

        <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
        <DeleteAccountModal isOpen={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
      </div>
    </Layout>
  );
};

export default Profile;
