import { useState, useEffect, Component } from 'react';
import { usePushNotifications } from '../../hooks/useNotifications';
import Modal from '../common/Modal';
import Button from '../common/Button';

// Error boundary wrapper to prevent PushNotificationPrompt from crashing the app
class PushNotificationErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('PushNotificationPrompt failed to render (non-critical):', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently hide — push notifications are not critical
    }
    return this.props.children;
  }
}

const PushNotificationPromptInner = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe, isSubscribing } = usePushNotifications();

  useEffect(() => {
    // Show prompt if:
    // 1. Push is supported
    // 2. Not already subscribed
    // 3. Permission is default (not granted or denied)
    // 4. User hasn't dismissed the prompt recently
    const dismissedAt = localStorage.getItem('push-prompt-dismissed');
    const shouldShow = 
      isSupported && 
      !isSubscribed && 
      permission === 'default' &&
      (!dismissedAt || Date.now() - parseInt(dismissedAt) > 7 * 24 * 60 * 60 * 1000); // 7 days

    if (shouldShow) {
      // Show after a short delay to not overwhelm the user
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    try {
      await subscribe();
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      // Error toast is already shown by the hook
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-prompt-dismissed', Date.now().toString());
  };

  const handleNeverAsk = () => {
    setShowPrompt(false);
    localStorage.setItem('push-prompt-dismissed', '9999999999999'); // Far future date
  };

  if (!showPrompt) return null;

  return (
    <Modal isOpen={showPrompt} onClose={handleDismiss}>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
          <span className="text-4xl">🔔</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Stay Updated with Push Notifications
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Get instant notifications about upcoming tasks, deadlines, and important updates - even when the app is closed!
        </p>

        {/* Benefits List */}
        <div className="text-left bg-purple-50 rounded-lg p-4 mb-6">
          <p className="font-semibold text-gray-900 mb-3">You'll be notified about:</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>Upcoming task deadlines</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🚨</span>
              <span>Overdue tasks that need attention</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📅</span>
              <span>Daily plan updates and summaries</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Schedule conflicts and important alerts</span>
            </li>
          </ul>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 mb-6">
          You can enable or disable notifications anytime from your <strong>Profile page</strong>. 
          We respect your privacy and won't spam you.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleEnable}
            disabled={isSubscribing}
            className="w-full cursor-pointer"
          >
            {isSubscribing ? 'Enabling...' : '🔔 Enable Notifications'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1 cursor-pointer"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleNeverAsk}
              variant="outline"
              className="flex-1 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Don't Ask Again
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Export the wrapped version so it never crashes the app
const PushNotificationPrompt = () => (
  <PushNotificationErrorBoundary>
    <PushNotificationPromptInner />
  </PushNotificationErrorBoundary>
);

export default PushNotificationPrompt;
