import nodemailer from 'nodemailer';

// Configure email transport (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  // Always show email content in development
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 SENDING EMAIL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${to}`);
  console.log(`From: ${process.env.EMAIL_USER}`);
  console.log(`Subject: ${subject}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Send email via Gmail SMTP
  try {
    const mailOptions = {
      from: `"Planning Project" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Link in email: Check content above\n`);
    
    return info;
  } catch (error) {
    console.log(`❌ Email send failed: ${error.message}\n`);
    
    if (error.responseCode === 535) {
      console.log('🔐 Authentication Error - Gmail rejected the password');
      console.log('💡 Solutions:');
      console.log('   1. Use App Password: https://myaccount.google.com/apppasswords');
      console.log('   2. Update EMAIL_PASSWORD in .env with App Password');
      console.log('   3. Restart backend server\n');
    }
    
    // Don't throw - let the application continue
    throw error;
  }
};