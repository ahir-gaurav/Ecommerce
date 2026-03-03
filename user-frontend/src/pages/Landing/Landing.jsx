import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../api';
import { ContainerScroll } from '../../components/ui/container-scroll-animation';
import './Landing.css';

function Landing() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter / Sort state
    const [activeType, setActiveType] = useState('All');
    const [sortBy, setSortBy] = useState('default');
    const [showInStock, setShowInStock] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const productRes = await productAPI.getAll();
            const fetchedProducts = productRes.data.products || productRes.data || [];
            setProducts(fetchedProducts);
        } catch (error) {
            console.error('Failed to fetch landing data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group product variants by type
    const getVariantsByType = () => {
        const typeMap = {};
        products.forEach((product) => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach((variant) => {
                    if (!typeMap[variant.type]) {
                        typeMap[variant.type] = [];
                    }
                    typeMap[variant.type].push({ ...variant, product });
                });
            }
        });
        return typeMap;
    };

    const typeIcons = { Standard: '🌿', Premium: '✨', Deluxe: '💎' };
    const typeDescriptions = {
        Standard: 'Essential freshness at an affordable price.',
        Premium: 'Enhanced formula with premium ingredients.',
        Deluxe: 'The ultimate shoe care experience.',
    };

    const variantsByType = getVariantsByType();
    const hasVariants = Object.keys(variantsByType).length > 0;
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    const getProductImage = (product) => {
        if (!product.images || product.images.length === 0) return null;
        const primary = product.images.find(img => img.isPrimary) || product.images[0];
        // Cloudinary URLs are absolute; local URLs are relative
        if (primary.url.startsWith('http')) return primary.url;
        return `${API_URL}${primary.url}`;
    };


    return (
        <div className="landing">
            {/* Hero — Scroll Animation */}
            <section style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d1f0d 100%)', overflow: 'hidden' }}>
                <ContainerScroll
                    titleComponent={
                        <div style={{ padding: '0 20px' }}>
                            <p style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                color: '#6ee77a',
                                marginBottom: '16px',
                                display: 'block',
                            }}>
                                🌿 100% Eco-Friendly Shoe Care
                            </p>
                            <h1 style={{
                                fontSize: 'clamp(2rem, 6vw, 5rem)',
                                fontWeight: '800',
                                lineHeight: '1.1',
                                color: '#ffffff',
                                marginBottom: '24px',
                                letterSpacing: '-1px',
                            }}>
                                Keep Your Kicks{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, #6ee77a, #22c55e)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                    Naturally Fresh
                                </span>
                            </h1>
                            <p style={{
                                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                                color: '#9ca3af',
                                marginBottom: '32px',
                                maxWidth: '520px',
                                margin: '0 auto 32px',
                                lineHeight: '1.7',
                            }}>
                                Bamboo charcoal, cedar & lavender — zero chemicals, 100% biodegradable. Reusable for months.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => navigate('/shop')}
                                    style={{
                                        display: 'inline-block',
                                        padding: '14px 32px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        color: '#fff',
                                        borderRadius: '50px',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 24px rgba(34,197,94,0.4)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        letterSpacing: '0.5px',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(34,197,94,0.5)'; }}
                                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(34,197,94,0.4)'; }}
                                >
                                    Shop Now →
                                </button>
                                <button
                                    onClick={() => {
                                        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    style={{
                                        display: 'inline-block',
                                        padding: '14px 32px',
                                        background: 'transparent',
                                        color: '#fff',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s, background 0.2s',
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                    View Collection
                                </button>
                            </div>
                        </div>
                    }
                >
                    {/* Hero image inside the 3D card */}
                    <img
                        src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1400&q=80"
                        alt="Premium eco-friendly shoe care products"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            borderRadius: '12px',
                            display: 'block',
                        }}
                    />
                </ContainerScroll>
            </section>

            {/* Marquee Banner */}
            <div className="marquee-banner">
                <div className="marquee-track">
                    <span>🌿 100% Eco-Friendly</span>
                    <span>♻️ Biodegradable</span>
                    <span>🌱 Chemical-Free</span>
                    <span>✨ Reusable for Months</span>
                    <span>🌍 Plastic-Free Packaging</span>
                    <span>🌿 100% Eco-Friendly</span>
                    <span>♻️ Biodegradable</span>
                    <span>🌱 Chemical-Free</span>
                    <span>✨ Reusable for Months</span>
                    <span>🌍 Plastic-Free Packaging</span>
                </div>
            </div>

            {/* Products Section */}
            <section id="products" className="products-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Collection</h2>
                        <p>Choose your perfect shoe care</p>
                    </div>

                    {loading ? (
                        <div className="flex-center" style={{ padding: '60px 0' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : hasVariants ? (() => {
                        // Limit to top 4 "fast selling" variants
                        const allVariants = Object.values(variantsByType).flat().slice(0, 4);

                        if (allVariants.length === 0) {
                            return (
                                <div className="no-products">
                                    <p>No products available.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="variants-grid">
                                {allVariants.map((variant, index) => {
                                    const finalPrice = variant.product.basePrice + (variant.priceAdjustment || 0);
                                    return (
                                        <div key={variant._id || index} className="variant-product-card">
                                            <div className="vpc-badge">{variant.size}</div>
                                            <div className="vpc-fragrance">🌸 {variant.fragrance}</div>
                                            <h4 className="vpc-name">{variant.product.name}</h4>
                                            <p className="vpc-size">{variant.type} · {variant.size}</p>
                                            <div className="vpc-price">₹{finalPrice}</div>
                                            <div className={`vpc-stock ${variant.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                            </div>
                                            <Link to={`/product/${variant.product._id}`} className="vpc-btn">
                                                View Product →
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })() : products.length > 0 ? (
                        <div className="variants-grid">
                            {products.slice(0, 4).map((product) => {
                                const imgUrl = getProductImage(product);
                                return (
                                    <div key={product._id} className="variant-product-card">
                                        {imgUrl && (
                                            <img
                                                src={imgUrl}
                                                alt={product.name}
                                                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                                            />
                                        )}
                                        <h4 className="vpc-name">{product.name}</h4>
                                        <p className="vpc-size" style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>{product.category}</p>
                                        <div className="vpc-price">₹{product.basePrice}</div>
                                        <Link to={`/product/${product._id}`} className="vpc-btn" style={{ marginTop: '12px' }}>
                                            View Product →
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-products">
                            <p>No products available yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-minimal">
                <div className="container">
                    <div className="features-row">
                        {[
                            { icon: '🌿', title: 'Natural', desc: 'Bamboo charcoal, cedar & lavender' },
                            { icon: '♻️', title: 'Reusable', desc: 'Use for months, then compost' },
                            { icon: '🚫', title: 'No Chemicals', desc: 'Zero synthetic ingredients' },
                            { icon: '🌍', title: 'Eco-Friendly', desc: '100% biodegradable materials' },
                        ].map((f, i) => (
                            <div key={i} className="feature-minimal-item">
                                <span className="feature-m-icon">{f.icon}</span>
                                <h4>{f.title}</h4>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Landing;
