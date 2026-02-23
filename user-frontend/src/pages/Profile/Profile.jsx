import { useAuth } from '../../context/AuthContext';
import './Profile.css';

function Profile() {
    const { user } = useAuth();

    return (
        <div className="profile-page">
            <div className="container">
                <h1>Profile</h1>
                {user && (
                    <div className="profile-card">
                        <div className="profile-avatar">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            <h2>Welcome, {user.name}!</h2>
                            <div className="profile-detail">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{user.email}</span>
                            </div>
                        </div>
                        <p className="profile-note">Profile management, order history, and address book will be implemented here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;
