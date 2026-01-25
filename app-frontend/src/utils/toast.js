import toast from 'react-hot-toast';

/**
 * Toast utility wrapper for consistent notifications
 */

export const showToast = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        position: 'top-right',
      }
    );
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

export default showToast;
