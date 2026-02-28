import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

import './Navbar.css';

function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const { getCartCount } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const closeMobile = () => setMenuOpen(false);

    return (
        <>
            <nav className="navbar">
                <div className="navbar-inner">
                    {/* Left: Hamburger + Nav Links */}
                    <div className="nav-left">
                        <button
                            className={`hamburger ${menuOpen ? 'active' : ''}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span /><span /><span />
                        </button>
                        <div className="nav-left-links">
                            <NavLink to="/" className="nav-link" end>Home</NavLink>
                            <NavLink to="/shop" className="nav-link">Shop</NavLink>
                        </div>
                    </div>

                    {/* Center: Logo */}
                    <Link to="/" className="navbar-brand">
                        Kicks Don't Stink
                    </Link>

                    {/* Right: Icons */}
                    <div className="nav-right">
                        {isAuthenticated ? (
                            <button onClick={() => navigate('/profile')} className="nav-icon-btn" title="Profile">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </button>
                        ) : (
                            <button onClick={() => navigate('/login')} className="nav-icon-btn" title="Account">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </button>
                        )}
                        <Link to="/cart" className="nav-icon-btn cart-icon-btn" title="Cart">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                            </svg>
                            {getCartCount() > 0 && (
                                <span className="cart-count">{getCartCount()}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Slide-out menu */}
            <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={closeMobile} />
            <div className={`slide-menu ${menuOpen ? 'open' : ''}`}>
                <div className="slide-menu-header">
                    <button className="close-menu" onClick={closeMobile}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="slide-menu-body">
                    <div className="slide-menu-section">
                        <NavLink to="/" className="slide-link" onClick={closeMobile} end>Home</NavLink>
                        <NavLink to="/shop" className="slide-link" onClick={closeMobile}>Shop</NavLink>
                        {!isAuthenticated && (
                            <>
                                <NavLink to="/login" className="slide-link" onClick={closeMobile}>Login</NavLink>
                                <NavLink to="/register" className="slide-link" onClick={closeMobile}>Sign Up</NavLink>
                            </>
                        )}
                    </div>

                    <div className="slide-menu-section">
                        <h4 className="slide-section-title">Info</h4>
                        <span className="slide-link-sub">About</span>
                        <span className="slide-link-sub">Contact</span>
                        <span className="slide-link-sub">FAQ</span>
                    </div>
                </div>

                {isAuthenticated && (
                    <div className="slide-menu-footer">
                        <button onClick={() => { logout(); closeMobile(); }} className="slide-logout-btn">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export default Navbar;
