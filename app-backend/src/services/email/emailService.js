import { Resend } from 'resend';

// Check if Resend API key is configured
const isResendConfigured = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key';

// Initialize Resend if configured
const resend = isResendConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async ({ to, subject, text }) => {
  // Always show email content in development
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL CONTENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(text);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Try to send via Resend
  try {
    if (!isResendConfigured || !resend) {
      console.log('⚠️  Email not sent (Resend API key not configured)');
      console.log('💡 To send real emails: Add RESEND_API_KEY to .env file\n');
      return;
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: to,
      subject: subject,
      text: text,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Email ID: ${data.id}\n`);
  } catch (error) {
    console.log(`❌ Email send failed: ${error.message}\n`);
    // Don't throw - let the application continue even if email fails
  }
};