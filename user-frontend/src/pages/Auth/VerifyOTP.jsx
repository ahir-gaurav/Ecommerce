import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import './Login.css';

function VerifyOTP() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const { verifyOTP } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await verifyOTP(email, otp);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');
        setResending(true);

        try {
            await authAPI.resendOTP({ email });
            setSuccess('A new verification code has been sent to your email.');
            setCountdown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    if (!email) return null;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card card">
                    <div className="auth-header">
                        <h2>Verify Your Email</h2>
                        <p>We sent a 6-digit code to <strong>{email}</strong></p>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                className="otp-input"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                maxLength={6}
                                placeholder="000000"
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || otp.length !== 6}>
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Didn't receive the code?{' '}
                            {countdown > 0 ? (
                                <span className="resend-countdown">Resend in {countdown}s</span>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="resend-btn"
                                >
                                    {resending ? 'Sending...' : 'Resend Code'}
                                </button>
                            )}
                        </p>
                        <p style={{ marginTop: '12px' }}>
                            Wrong email? <Link to="/register">Go back</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyOTP;
