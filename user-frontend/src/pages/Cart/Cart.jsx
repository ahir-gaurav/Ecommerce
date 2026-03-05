import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { couponAPI } from '../../api';
import './Cart.css';

function Cart() {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponApplying, setCouponApplying] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    // appliedCoupon shape: { code, discountType, value, discountValue, finalTotal }

    if (cart.length === 0) {
        return (
            <div className="cart-empty">
                <div className="container">
                    <h2>Your cart is empty</h2>
                    <p>Add some eco-friendly products to get started!</p>
                    <Link to="/shop" className="btn btn-primary btn-lg">
                        Shop Now
                    </Link>
                </div>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const gst = subtotal * 0.18;
    const delivery = 50;
    const discountValue = appliedCoupon?.discountValue || 0;
    const total = subtotal + gst + delivery - discountValue;

    const handleApplyCoupon = async () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponApplying(true);
        setCouponError('');

        try {
            const res = await couponAPI.validate({ code, amount: subtotal });
            if (res.data.success) {
                setAppliedCoupon(res.data.coupon);
                setCouponCode('');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid coupon code';
            setCouponError(msg);
            setAppliedCoupon(null);
        } finally {
            setCouponApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
        setCouponCode('');
    };

    const handleCheckout = () => {
        navigate('/checkout', {
            state: {
                appliedCoupon: appliedCoupon
                    ? { code: appliedCoupon.code, discountValue }
                    : null
            }
        });
    };

    return (
        <div className="cart-page">
            <div className="container">
                <h1>Shopping Cart</h1>

                <div className="cart-content">
                    <div className="cart-items">
                        {cart.map((item) => (
                            <div key={`${item.productId}-${item.variantId}`} className="cart-item card">
                                <div className="item-info">
                                    <h3>{item.productName}</h3>
                                    <p className="variant-info">
                                        {item.variantDetails.type} - {item.variantDetails.size} - {item.variantDetails.fragrance}
                                    </p>
                                    <p className="item-price">₹{item.price}</p>
                                </div>

                                <div className="item-controls">
                                    <div className="quantity-controls">
                                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}>
                                            -
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}>
                                            +
                                        </button>
                                    </div>

                                    <button
                                        className="btn-remove"
                                        onClick={() => removeFromCart(item.productId, item.variantId)}
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="item-total">
                                    ₹{item.price * item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary card">
                        <h2>Order Summary</h2>

                        {/* ── Coupon Section ── */}
                        <div className="coupon-section">
                            {appliedCoupon ? (
                                <div className="coupon-applied">
                                    <div className="coupon-applied-row">
                                        <span className="coupon-tag">🎟️ <strong>{appliedCoupon.code}</strong></span>
                                        <button className="coupon-remove-btn" onClick={handleRemoveCoupon} title="Remove coupon">✕</button>
                                    </div>
                                    <p className="coupon-applied-msg">
                                        {appliedCoupon.discountType === 'percentage'
                                            ? `${appliedCoupon.value}% off applied`
                                            : `₹${appliedCoupon.value} off applied`}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label className="coupon-label">Have a coupon?</label>
                                    <div className="coupon-input-row">
                                        <input
                                            type="text"
                                            className="coupon-input"
                                            placeholder="Enter coupon code"
                                            value={couponCode}
                                            onChange={(e) => {
                                                setCouponCode(e.target.value.toUpperCase());
                                                if (couponError) setCouponError('');
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            disabled={couponApplying}
                                        />
                                        <button
                                            className="coupon-apply-btn"
                                            onClick={handleApplyCoupon}
                                            disabled={couponApplying || !couponCode.trim()}
                                        >
                                            {couponApplying ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError && <p className="coupon-error">{couponError}</p>}
                                </>
                            )}
                        </div>

                        <div className="summary-divider" />

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>GST (18%)</span>
                            <span>₹{gst.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Delivery</span>
                            <span>₹{delivery.toFixed(2)}</span>
                        </div>

                        {appliedCoupon && (
                            <div className="summary-row discount-row">
                                <span>Discount ({appliedCoupon.code})</span>
                                <span>-₹{discountValue.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="summary-divider"></div>

                        <div className="summary-row total">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        {isAuthenticated ? (
                            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleCheckout}>
                                Proceed to Checkout
                            </button>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                Login to Checkout
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cart;
