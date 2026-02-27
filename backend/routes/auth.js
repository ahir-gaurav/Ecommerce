import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTP } from '../utils/email.js';

const router = express.Router();

// Register user (with OTP email verification)
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Resend OTP for unverified user
                await OTP.deleteMany({ email, purpose: 'registration' });
                const otpCode = OTP.generateOTP();
                await OTP.create({ email, otp: otpCode, purpose: 'registration' });
                await sendOTP(email, otpCode, 'registration');
                return res.status(200).json({
                    success: true,
                    message: 'Verification code resent to your email',
                    requiresVerification: true
                });
            }
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create user as unverified
        const user = await User.create({ name, email, password, isVerified: false });
        console.log(`👤 New user created: ${email} (unverified)`);

        // Generate and send OTP
        const otpCode = OTP.generateOTP();
        await OTP.create({ email, otp: otpCode, purpose: 'registration' });

        const emailSent = await sendOTP(email, otpCode, 'registration');
        if (!emailSent) {
            console.error(`❌ Failed to send registration OTP to ${email}`);
            return res.status(500).json({
                success: false,
                message: 'Account created but failed to send verification email. Please try logging in to resend code.'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            requiresVerification: true
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Verify OTP
router.post('/verify-otp', [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await OTP.findOne({ email, otp, purpose: 'registration' }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Explicitly check expiry (in case MongoDB TTL hasn't cleaned it up yet)
        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteMany({ email, purpose: 'registration' });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify user
        const user = await User.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        );

        // Delete OTP
        await OTP.deleteMany({ email, purpose: 'registration' });

        // Generate JWT
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            success: true,
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

// Resend OTP
router.post('/resend-otp', [
    body('email').isEmail()
], async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email already verified' });
        }

        // Delete old OTPs
        await OTP.deleteMany({ email, purpose: 'registration' });

        // Generate new OTP
        const otpCode = OTP.generateOTP();
        await OTP.create({ email, otp: otpCode, purpose: 'registration' });
        await sendOTP(email, otpCode, 'registration');

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to resend OTP' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log(`🚫 Invalid password attempt for: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log(`✅ User logged in successfully: ${email}`);
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Forgot password
router.post('/forgot-password', [
    body('email').isEmail()
], async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otpCode = OTP.generateOTP();
        await OTP.create({ email, otp: otpCode, purpose: 'password-reset' });
        await sendOTP(email, otpCode, 'password-reset');

        res.json({ success: true, message: 'Password reset code sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Failed to send reset code' });
    }
});

// Reset password
router.post('/reset-password', [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const otpRecord = await OTP.findOne({ email, otp, purpose: 'password-reset' }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Explicitly check expiry (in case MongoDB TTL hasn't cleaned it up yet)
        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteMany({ email, purpose: 'password-reset' });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        const user = await User.findOne({ email });
        user.password = newPassword;
        await user.save();

        await OTP.deleteMany({ email, purpose: 'password-reset' });

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Password reset failed' });
    }
});

export default router;
