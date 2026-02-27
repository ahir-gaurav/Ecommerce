import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';

dotenv.config();

// Create Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

const SENDER_EMAIL = process.env.EMAIL_USER || 'iamgauravyaduvanshi@gmail.com';
const SENDER_NAME = 'Kicks Don\'t Stink';
const LOGO_URL = 'https://i.ibb.co/YBntQvVb/logo.png';

// Helper to send email via Mailjet
const sendEmail = async (to, subject, html) => {
  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: SENDER_EMAIL, Name: SENDER_NAME },
        To: [{ Email: to }],
        Subject: subject,
        HTMLPart: html
      }
    ]
  });

  const result = await request;
  return result.body;
};

// Send OTP email
export const sendOTP = async (email, otp, purpose) => {
  const subject = purpose === 'registration'
    ? 'Verify Your Email - Kicks Don\'t Stink'
    : 'Password Reset Code - Kicks Don\'t Stink';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #f5f0e1; padding: 18px 30px; text-align: center; color: #3a2a1a; }
        .content { padding: 40px 30px; }
        .otp-box { background: #f8f9fa; border: 2px dashed #4a7c2c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2d5016; letter-spacing: 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .brand-logo { width: 150px; height: 150px; object-fit: contain; display: block; margin: 0 auto 10px auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Kicks Don't Stink" class="brand-logo" />
          <h1 style="margin: 0;">Kicks Don't Stink</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Sustainable Shoe Care</p>
        </div>
        <div class="content">
          <h2 style="color: #2d5016;">Your Verification Code</h2>
          <p>Hello!</p>
          <p>Your one-time password (OTP) for ${purpose === 'registration' ? 'email verification' : 'password reset'} is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Kicks Don't Stink Team</strong></p>
        </div>
        <div class="footer">
          <p>🌍 Eco-Friendly • ♻️ Sustainable • 🌱 Chemical-Free</p>
          <p>&copy; 2026 Kicks Don't Stink. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Attempting to send OTP to ${email}...`);
    const result = await sendEmail(email, subject, html);
    const status = result.Messages?.[0]?.Status;
    if (status === 'success') {
      console.log(`✅ OTP email sent to ${email}`);
      return true;
    } else {
      console.error('❌ Mailjet send failed:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message, error.statusCode);
    return false;
  }
};

// Send order confirmation email
export const sendOrderConfirmation = async (email, orderData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .order-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .item { border-bottom: 1px solid #dee2e6; padding: 10px 0; }
        .total { font-size: 20px; font-weight: bold; color: #2d5016; margin-top: 15px; padding-top: 15px; border-top: 2px solid #2d5016; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0;">Thank you for your purchase</p>
        </div>
        <div class="content">
          <h2 style="color: #2d5016;">Order #${orderData.orderNumber}</h2>
          <p>Hi ${orderData.customerName},</p>
          <p>Your order has been confirmed and will be processed shortly.</p>
          <div class="order-details">
            <h3 style="margin-top: 0;">Order Summary</h3>
            ${orderData.items.map(item => `
              <div class="item">
                <strong>${item.productName}</strong><br>
                <small>${item.variantDetails}</small><br>
                Quantity: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}
              </div>
            `).join('')}
            <div class="total">Total: ₹${orderData.total}</div>
          </div>
          <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
          <p>We'll send you another email when your order ships.</p>
          <p style="margin-top: 30px;">Thank you for choosing sustainable products! 🌱</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Kicks Don't Stink. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(email, `Order Confirmation - ${orderData.orderNumber}`, html);
    const status = result.Messages?.[0]?.Status;
    console.log(`✅ Order confirmation sent to ${email}`);
    return status === 'success';
  } catch (error) {
    console.error('Email sending error:', error.message);
    return false;
  }
};

// Send admin alert
export const sendAdminAlert = async (subject, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 20px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="alert">
        <h2>⚠️ ${subject}</h2>
        <p>${message}</p>
        <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(SENDER_EMAIL, `[ALERT] ${subject}`, html);
    return result.Messages?.[0]?.Status === 'success';
  } catch (error) {
    console.error('Admin alert error:', error.message);
    return false;
  }
};
