import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import {
  getMe,
  getUsers,
  getUserById,
  deleteUser
} from '../api/usersApi';

// Query keys
export const USER_KEYS = {
  all: ['users'],
  me: () => [...USER_KEYS.all, 'me'],
  lists: () => [...USER_KEYS.all, 'list'],
  details: () => [...USER_KEYS.all, 'detail'],
  detail: (id) => [...USER_KEYS.details(), id],
};

/**
 * Get current user (me)
 */
export const useMe = () => {
  return useQuery({
    queryKey: USER_KEYS.me(),
    queryFn: getMe,
  });
};

/**
 * Get all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: USER_KEYS.lists(),
    queryFn: getUsers,
  });
};

/**
 * Get user by ID
 */
export const useUser = (userId) => {
  return useQuery({
    queryKey: USER_KEYS.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

/**
 * Delete user account
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, userId) => {
      const currentUser = useAuthStore.getState().user;
      
      // If deleting own account, logout
      if (currentUser?.id === userId) {
        logout();
        toast.success('Account deleted successfully');
      } else {
        queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
        toast.success('User deleted successfully');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });
};
