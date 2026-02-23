import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        verificationCode: '',
        role: 'Admin'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Dynamic label and placeholder based on selected role
    const verificationLabel = form.role === 'Owner'
        ? 'Owner Verification Code'
        : 'Admin Verification Code';

    const verificationPlaceholder = form.role === 'Owner'
        ? 'Enter the owner code'
        : 'Enter the admin code';

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Admin Register</h2>
                        <p>Create an admin account with verification code</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="Your name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="admin@kicksdontstink.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <select id="role" name="role" value={form.role} onChange={handleChange}>
                                <option value="Admin">Admin</option>
                                <option value="Owner">Owner</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="verificationCode">{verificationLabel}</label>
                            <input
                                type="text"
                                id="verificationCode"
                                name="verificationCode"
                                value={form.verificationCode}
                                onChange={handleChange}
                                required
                                placeholder={verificationPlaceholder}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
