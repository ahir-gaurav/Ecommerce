import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section footer-brand-section">
                        <Link to="/" className="footer-brand">
                            <img src={logo} alt="KDS" className="footer-logo" />
                            <span className="footer-brand-name">Kicks Don't Stink</span>
                        </Link>
                        <p className="footer-tagline">Sustainable shoe care for a better tomorrow.</p>
                    </div>

                    <div className="footer-section">
                        <h4>Shop</h4>
                        <ul>
                            <li><Link to="/#products">All Products</Link></li>
                            <li><Link to="/cart">Cart</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Info</h4>
                        <ul>
                            <li><span>About</span></li>
                            <li><span>Contact</span></li>
                            <li><span>FAQ</span></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Contact</h4>
                        <p>hello@kicksdontstink.com</p>
                        <p>+91 1234567890</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Kicks Don't Stink. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
