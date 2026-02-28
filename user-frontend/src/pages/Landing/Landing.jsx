import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, heroAPI } from '../../api';
import './Landing.css';

function Landing() {
    const [products, setProducts] = useState([]);
    const [heroSlides, setHeroSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [productRes, heroRes] = await Promise.all([
                productAPI.getAll(),
                heroAPI.getSlides()
            ]);

            const fetchedProducts = productRes.data.products || productRes.data || [];
            setProducts(fetchedProducts);

            const fetchedHeroSlides = heroRes.data.slides || [];

            if (fetchedHeroSlides.length > 0) {
                setHeroSlides(fetchedHeroSlides);
            } else {
                // Build hero slides from product images or fallback
                const slides = [];
                fetchedProducts.forEach((product) => {
                    if (product.images && product.images.length > 0) {
                        product.images.forEach((img) => {
                            slides.push({
                                image: img.url,
                                title: product.name,
                                subtitle: product.description?.substring(0, 60) + '...',
                                ctaLink: `/product/${product._id}`,
                                ctaText: 'Shop Now'
                            });
                        });
                    }
                });

                if (slides.length === 0) {
                    setHeroSlides([
                        { title: 'Keep Your Kicks Fresh', subtitle: 'Naturally', bgColor: '#f5f0eb', ctaLink: '#products', ctaText: 'Shop Now' },
                        { title: 'Eco-Friendly', subtitle: 'Shoe Care', bgColor: '#eef2e7', ctaLink: '#products', ctaText: 'Shop Now' },
                        { title: 'Zero Chemicals', subtitle: 'Pure Freshness', bgColor: '#f0ebe5', ctaLink: '#products', ctaText: 'Shop Now' },
                    ]);
                } else {
                    setHeroSlides(slides);
                }
            }
        } catch (error) {
            console.error('Failed to fetch landing data:', error);
            setHeroSlides([
                { title: 'Keep Your Kicks Fresh', subtitle: 'Naturally', bgColor: '#f5f0eb', ctaLink: '#products', ctaText: 'Shop Now' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-rotate
    useEffect(() => {
        if (heroSlides.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 4000);
        return () => clearInterval(intervalRef.current);
    }, [heroSlides.length]);

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
            {/* Hero — Rotating Image Carousel */}
            <section className="hero-carousel">
                {loading ? (
                    <div className="carousel-track" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="carousel-track">
                        {heroSlides.map((slide, i) => (
                            <div
                                key={slide._id || i}
                                className={`carousel-slide ${i === currentSlide ? 'active' : ''}`}
                                style={{ backgroundColor: slide.bgColor || '#f5f0eb' }}
                            >
                                {slide.image ? (
                                    <div className="hero-slide-content has-image">
                                        <div className="hero-text-overlay">
                                            <h1 className="carousel-heading">{slide.title}</h1>
                                            <p className="carousel-sub">{slide.subtitle}</p>
                                            <Link to={slide.ctaLink || '#products'} className="carousel-cta">{slide.ctaText || 'Shop Now'}</Link>
                                        </div>
                                        <img src={slide.image?.startsWith('http') ? slide.image : `${API_URL}${slide.image}`} alt={slide.title} className="carousel-img" />
                                    </div>
                                ) : (
                                    <div className="carousel-text-slide">
                                        <h1 className="carousel-heading">{slide.title}</h1>
                                        <p className="carousel-sub">{slide.subtitle}</p>
                                        <Link to={slide.ctaLink || '#products'} className="carousel-cta">{slide.ctaText || 'Shop Now'}</Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Dots */}
                {heroSlides.length > 1 && (
                    <div className="carousel-dots">
                        {heroSlides.map((_, i) => (
                            <button
                                key={i}
                                className={`dot ${i === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(i)}
                            />
                        ))}
                    </div>
                )}
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

            {/* Products By Type */}
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
                    ) : products.length > 0 ? (
                        hasVariants ? (
                            // Show grouped by variant type if variants exist
                            <div className="products-by-type">
                                {['Standard', 'Premium', 'Deluxe'].map((type) => {
                                    const variants = variantsByType[type];
                                    if (!variants || variants.length === 0) return null;
                                    return (
                                        <div key={type} className="type-group">
                                            <div className="type-header">
                                                <span className="type-icon">{typeIcons[type]}</span>
                                                <div>
                                                    <h3 className="type-title">{type}</h3>
                                                    <p className="type-desc">{typeDescriptions[type]}</p>
                                                </div>
                                            </div>
                                            <div className="variants-grid">
                                                {variants.map((variant, index) => {
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
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // Fallback: show all products as simple cards (no variants yet)
                            <div className="variants-grid">
                                {products.map((product) => {
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
                        )
                    ) : (
                        <div className="no-products">
                            <p>No products available yet. Check back soon!</p>
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
