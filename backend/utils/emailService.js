const nodemailer = require("nodemailer");

// Email configuration
// For Gmail: Enable "Less secure app access" OR use App Password
// To get App Password: Google Account -> Security -> 2-Step Verification -> App passwords
const EMAIL_CONFIG = {
  service: "gmail",
  auth: {
    user: "ralphfrani88@gmail.com",      // Replace with your Gmail
    pass: "knou qqhc vxda gdyv"           // Replace with your App Password (not regular password)
  }
};

// Create transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Send password reset code
async function sendResetCode(toEmail, studentNumber, resetCode) {
  const mailOptions = {
    from: `"Library System" <${EMAIL_CONFIG.auth.user}>`,
    to: toEmail,
    subject: "Password Reset Code - Library System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #556B2F 0%, #3d4f22 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Library System</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>

        <div style="background: #f8f6f3; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            Hello,<br><br>
            We received a password reset request for your account (Student Number: <strong>${studentNumber}</strong>).
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your reset code is:</p>
            <div style="background: #556B2F; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 8px; display: inline-block;">
              ${resetCode}
            </div>
          </div>

          <p style="color: #666; font-size: 14px;">
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            CvSU Library Management System
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Send welcome email (optional)
async function sendWelcomeEmail(toEmail, studentName) {
  const mailOptions = {
    from: `"Library System" <${EMAIL_CONFIG.auth.user}>`,
    to: toEmail,
    subject: "Welcome to Library System - CvSU",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #556B2F 0%, #3d4f22 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Library System!</h1>
        </div>

        <div style="background: #f8f6f3; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">
            Hello <strong>${studentName}</strong>,<br><br>
            Your account has been successfully created! You can now:
          </p>

          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>Check in/out of the library</li>
            <li>Borrow and return books</li>
            <li>Reserve computer stations</li>
            <li>View your borrowing history</li>
          </ul>

          <p style="color: #666; font-size: 14px;">
            Login with your student number and password to get started.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            CvSU Library Management System
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
}

// Send email verification code for signup
async function sendVerificationCode(toEmail, verificationCode) {
  const mailOptions = {
    from: `"Library System" <${EMAIL_CONFIG.auth.user}>`,
    to: toEmail,
    subject: "Email Verification Code - Library System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #556B2F 0%, #3d4f22 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Library System</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
        </div>

        <div style="background: #f8f6f3; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            Hello,<br><br>
            Thank you for registering with CvSU Library System. Please use the verification code below to confirm your email address.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
            <div style="background: #556B2F; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px 30px; border-radius: 8px; display: inline-block;">
              ${verificationCode}
            </div>
          </div>

          <p style="color: #666; font-size: 14px;">
            This code will expire in <strong>10 minutes</strong>.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            CvSU Library Management System
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
}

// Test email connection
async function testConnection() {
  try {
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error.message);
    return false;
  }
}

module.exports = {
  sendResetCode,
  sendWelcomeEmail,
  sendVerificationCode,
  testConnection
};
