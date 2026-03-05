import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, tickerAPI } from '../../api';
import HeroSlider from '../../components/HeroSlider/HeroSlider';
import './Landing.css';



function Landing() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tickers, setTickers] = useState([]);

    // Filter / Sort state
    const [activeType, setActiveType] = useState('All');
    const [sortBy, setSortBy] = useState('default');
    const [showInStock, setShowInStock] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productRes, tickerRes] = await Promise.allSettled([
                productAPI.getAll(),
                tickerAPI.getAll()
            ]);

            if (productRes.status === 'fulfilled') {
                const fetchedProducts = productRes.value?.data?.products || productRes.value?.data || [];
                setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
            } else {
                console.error('Products fetch failed:', productRes.reason);
                setError('Failed to load products. Please check your connection.');
            }

            if (tickerRes.status === 'fulfilled') {
                setTickers(tickerRes.value?.data?.tickers || []);
            }
        } catch (err) {
            console.error('Failed to fetch landing data:', err);
            setError('Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Skeleton Component for Products
    const ProductsSkeleton = () => (
        <div className="variants-grid">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card">
                    <div className="shimmer sk-img" />
                    <div className="shimmer sk-badge" />
                    <div className="shimmer sk-fragrance" />
                    <div className="shimmer sk-name" />
                    <div className="shimmer sk-price" />
                    <div className="shimmer sk-btn" />
                </div>
            ))}
        </div>
    );

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
        if (primary.url.startsWith('http')) return primary.url;
        return `${API_URL}${primary.url}`;
    };

    return (
        <div className="landing">
            {/* Hero Slider */}
            <HeroSlider />

            {/* Marquee Banner */}
            <div className="marquee-banner">
                <div className="marquee-track">
                    {tickers.length > 0 ? (
                        // Render items twice for seamless loop
                        [...tickers, ...tickers].map((ticker, i) => (
                            <span key={`${ticker._id}-${i}`}>
                                {ticker.icon} {ticker.text}
                            </span>
                        ))
                    ) : (
                        // Fallback static items if none in DB
                        <>
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
                        </>
                    )}
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
                        <ProductsSkeleton />
                    ) : error ? (
                        <div className="error-container">
                            <p>⚠️ {error}</p>
                            <button className="btn-retry" onClick={fetchInitialData}>
                                Retry Loading
                            </button>
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
                                    const imgUrl = getProductImage(variant.product);
                                    return (
                                        <div key={variant._id || index} className="variant-product-card">
                                            {imgUrl && (
                                                <img
                                                    src={imgUrl}
                                                    alt={variant.product.name}
                                                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                                                />
                                            )}
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
