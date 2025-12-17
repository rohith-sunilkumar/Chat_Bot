import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter based on configuration
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.log('💡 Please check your EMAIL_USER and EMAIL_PASSWORD in .env');
      console.log('💡 Make sure you are using Gmail App Password (not regular password)');
      transporter = null; // Disable email sending if verification fails
    } else {
      console.log('✅ Email service ready - Gmail connected successfully');
    }
  });
} else {
  console.log('⚠️  Email credentials not found - running in development mode');
}

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Chat App',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            color: #2563eb;
            margin-bottom: 30px;
          }
          .otp-box {
            background-color: #f0f7ff;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            letter-spacing: 5px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
          </div>
          <p>Hello,</p>
          <p>Thank you for registering with Chat App! Please use the following OTP to verify your email address:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>© 2024 Chat App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // Development mode: Log OTP to console if email not configured
    if (!transporter) {
      console.log('\n' + '='.repeat(50));
      console.log('📧 DEVELOPMENT MODE - OTP EMAIL');
      console.log('='.repeat(50));
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires: 10 minutes`);
      console.log('='.repeat(50) + '\n');
      return { success: true };
    }

    // Production mode: Send actual email
    console.log(`📤 Attempting to send OTP email to ${email}...`);
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    console.error('Full error:', error);
    
    // Fallback to development mode on error
    console.log('\n' + '='.repeat(50));
    console.log('📧 FALLBACK - OTP EMAIL (Email service failed)');
    console.log('='.repeat(50));
    console.log(`To: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires: 10 minutes`);
    console.log('='.repeat(50) + '\n');
    
    return { success: false, error: error.message };
  }
};
