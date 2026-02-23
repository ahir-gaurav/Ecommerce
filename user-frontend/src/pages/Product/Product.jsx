import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import './Product.css';

function Product() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await productAPI.getById(id);
            setProduct(response.data.product);
            if (response.data.product.variants.length > 0) {
                setSelectedVariant(response.data.product.variants[0]);
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product && selectedVariant) {
            addToCart(product, selectedVariant, quantity);
            alert('Added to cart!');
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h2>Product not found</h2>
            </div>
        );
    }

    const finalPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);

    return (
        <div className="product-page">
            <div className="container">
                <div className="product-content">
                    <motion.div
                        className="product-image-section"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="product-image-placeholder">
                            <div className="product-icon-large">👟</div>
                        </div>
                        <div className="eco-features">
                            <div className="eco-badge">🌍 Eco-Friendly</div>
                            <div className="eco-badge">♻️ Biodegradable</div>
                            <div className="eco-badge">🌱 Chemical-Free</div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="product-info-section"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1>{product.name}</h1>
                        <p className="product-description">{product.description}</p>

                        <div className="product-price">
                            <span className="price">₹{finalPrice}</span>
                        </div>

                        {/* Variant Selection */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="variant-selection">
                                <h3>Select Variant</h3>
                                <div className="variant-grid">
                                    {product.variants.map((variant) => (
                                        <button
                                            key={variant._id}
                                            className={`variant-card ${selectedVariant?._id === variant._id ? 'active' : ''}`}
                                            onClick={() => setSelectedVariant(variant)}
                                        >
                                            <div className="variant-name">
                                                {variant.type} - {variant.size}
                                            </div>
                                            <div className="variant-fragrance">{variant.fragrance}</div>
                                            <div className="variant-stock">
                                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="quantity-section">
                            <h3>Quantity</h3>
                            <div className="quantity-controls">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                                <span>{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || selectedVariant.stock === 0}
                            style={{ width: '100%' }}
                        >
                            {selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        {/* Features */}
                        <div className="product-features">
                            <h3>Features</h3>
                            <ul>
                                <li>✅ Eliminates odor naturally</li>
                                <li>✅ No chemicals or plastic</li>
                                <li>✅ Reusable for months</li>
                                <li>✅ Compostable by burying in soil</li>
                                <li>✅ Eco-friendly packaging</li>
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Product;
