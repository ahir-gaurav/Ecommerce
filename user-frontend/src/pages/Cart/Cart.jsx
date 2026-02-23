import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

function Cart() {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const { isAuthenticated } = useAuth();

    if (cart.length === 0) {
        return (
            <div className="cart-empty">
                <div className="container">
                    <h2>Your cart is empty</h2>
                    <p>Add some eco-friendly products to get started!</p>
                    <Link to="/product/1" className="btn btn-primary btn-lg">
                        Shop Now
                    </Link>
                </div>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const gst = subtotal * 0.18;
    const delivery = 50;
    const total = subtotal + gst + delivery;

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

                        <div className="summary-divider"></div>

                        <div className="summary-row total">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>

                        {isAuthenticated ? (
                            <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                Proceed to Checkout
                            </Link>
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
