import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1>Kicks Don't <span>Stink</span></h1>
                <p>Admin Panel</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" end>
                    <span className="nav-icon">📊</span>
                    Dashboard
                </NavLink>
                <NavLink to="/products">
                    <span className="nav-icon">📦</span>
                    Products
                </NavLink>
                <NavLink to="/orders">
                    <span className="nav-icon">🛒</span>
                    Orders
                </NavLink>
                <NavLink to="/hero">
                    <span className="nav-icon">🖼️</span>
                    Hero Section
                </NavLink>
                <NavLink to="/users">
                    <span className="nav-icon">👥</span>
                    Users
                </NavLink>
                <NavLink to="/settings">
                    <span className="nav-icon">⚙️</span>
                    Settings
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="admin-info">
                    <div className="admin-avatar">
                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div className="admin-name">{admin?.name || 'Admin'}</div>
                        <div className="admin-role">{admin?.role || 'Admin'}</div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <span className="nav-icon">🚪</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
