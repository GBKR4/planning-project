import webpush from 'web-push';

/**
 * Generate VAPID keys for Web Push notifications
 * Run this once to generate keys, then add them to your .env file
 */
export const generateVAPIDKeys = () => {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 VAPID Keys Generated');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Add these to your .env file:\n');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('VAPID_EMAIL=mailto:your-email@example.com');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return vapidKeys;
};

/**
 * Get VAPID keys from environment variables
 */
export const getVAPIDKeys = () => {
  return {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    email: process.env.VAPID_EMAIL || 'mailto:admin@example.com'
  };
};

/**
 * Validate that VAPID keys are configured
 */
export const validateVAPIDKeys = () => {
  const keys = getVAPIDKeys();
  
  if (!keys.publicKey || !keys.privateKey) {
    console.warn('\n⚠️  WARNING: VAPID keys not configured!');
    console.warn('Push notifications will not work.');
    console.warn('Run: node src/utils/generateVapidKeys.js');
    console.warn('Then add the keys to your .env file\n');
    return false;
  }
  
  console.log('✅ VAPID keys configured');
  return true;
};

/**
 * Get VAPID details formatted for web-push
 */
export const getVAPIDDetails = () => {
  const keys = getVAPIDKeys();
  
  return {
    subject: keys.email,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey
  };
};
