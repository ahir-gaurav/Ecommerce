import { BrevoClient } from '@getbrevo/brevo';

const SENDER_EMAIL = process.env.EMAIL_USER || 'iamgauravyaduvanshi@gmail.com';
const SENDER_NAME = "Kicks Don't Stink";
const LOGO_URL = 'https://i.ibb.co/YBntQvVb/logo.png';

// Lazy-initialize client so it always reads BREVO_API_KEY at call time (not import time)
const getBrevoClient = () => {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set in environment variables');
  return new BrevoClient({ apiKey: key });
};

// Helper to send email
const sendEmail = async (to, subject, htmlContent) => {
  const brevo = getBrevoClient();
  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent
  });
  return result;
};

// Send OTP email
export const sendOTP = async (email, otp, purpose) => {
  const subject = purpose === 'registration'
    ? "Verify Your Email - Kicks Don't Stink"
    : "Password Reset Code - Kicks Don't Stink";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #f5f0e1; padding: 18px 30px; text-align: center; color: #3a2a1a; }
        .content { padding: 40px 30px; }
        .otp-box { background: #f8f9fa; border: 2px dashed #4a7c2c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #2d5016; letter-spacing: 8px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .brand-logo { width: 120px; height: 120px; object-fit: contain; display: block; margin: 0 auto 10px auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Kicks Don't Stink" class="brand-logo" />
          <h1 style="margin:0;">Kicks Don't Stink</h1>
          <p style="margin:8px 0 0 0;opacity:0.8;">Sustainable Shoe Care</p>
        </div>
        <div class="content">
          <h2 style="color:#2d5016;">Your Verification Code</h2>
          <p>Hello!</p>
          <p>Your OTP for ${purpose === 'registration' ? 'email verification' : 'password reset'} is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>This code expires in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="margin-top:30px;">Best regards,<br><strong>Kicks Don't Stink Team</strong></p>
        </div>
        <div class="footer">
          <p>🌍 Eco-Friendly &bull; ♻️ Sustainable &bull; 🌱 Chemical-Free</p>
          <p>&copy; 2026 Kicks Don't Stink. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Sending OTP to ${email} via Brevo API...`);
    await sendEmail(email, subject, htmlContent);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error?.message || error);
    return false;
  }
};

// Send order confirmation email
export const sendOrderConfirmation = async (email, orderData) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg,#2d5016,#4a7c2c); padding: 30px; text-align: center; color: white; }
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
          <h1 style="margin:0;">✅ Order Confirmed!</h1>
          <p style="margin:8px 0 0 0;">Thank you for your purchase</p>
        </div>
        <div class="content">
          <h2 style="color:#2d5016;">Order #${orderData.orderNumber}</h2>
          <p>Hi ${orderData.customerName},</p>
          <p>Your order has been confirmed and will be processed shortly.</p>
          <div class="order-details">
            <h3 style="margin-top:0;">Order Summary</h3>
            ${orderData.items.map(item => `
              <div class="item">
                <strong>${item.productName}</strong><br>
                <small>${item.variantDetails}</small><br>
                Qty: ${item.quantity} &times; &#8377;${item.price} = &#8377;${item.quantity * item.price}
              </div>
            `).join('')}
            <div class="total">Total: &#8377;${orderData.total}</div>
          </div>
          <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
          <p style="margin-top:30px;">Thank you for choosing sustainable products! 🌱</p>
        </div>
        <div class="footer"><p>&copy; 2026 Kicks Don't Stink. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail(email, `Order Confirmation - ${orderData.orderNumber}`, htmlContent);
    console.log(`✅ Order confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Order confirmation email error:', error?.message || error);
    return false;
  }
};

// Send admin alert
export const sendAdminAlert = async (subject, message) => {
  const htmlContent = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;padding:20px;}
      .alert{background:#fff3cd;border-left:4px solid #ffc107;padding:20px;border-radius:5px;}
    </style></head>
    <body><div class="alert">
      <h2>⚠️ ${subject}</h2><p>${message}</p>
      <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
    </div></body></html>
  `;
  try {
    await sendEmail(SENDER_EMAIL, `[ALERT] ${subject}`, htmlContent);
    return true;
  } catch (error) {
    console.error('❌ Admin alert error:', error?.message || error);
    return false;
  }
};
