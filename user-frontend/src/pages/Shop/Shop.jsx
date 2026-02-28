import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../api';
import './Shop.css';

function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('All');
    const [sortBy, setSortBy] = useState('default');
    const [showInStock, setShowInStock] = useState(false);

    const typeIcons = { Standard: '🌿', Premium: '✨', Deluxe: '💎' };
    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    useEffect(() => {
        productAPI.getAll().then(res => {
            setProducts(res.data.products || res.data || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    // Flatten all variants from all products
    const getAllVariants = () => {
        const all = [];
        products.forEach(product => {
            (product.variants || []).forEach(variant => {
                all.push({ ...variant, product });
            });
        });
        return all;
    };

    const getProductImage = (product) => {
        if (!product.images || product.images.length === 0) return null;
        const primary = product.images.find(img => img.isPrimary) || product.images[0];
        if (primary.url.startsWith('http')) return primary.url;
        return `${API_URL}${primary.url}`;
    };

    const allVariants = getAllVariants();
    const hasVariants = allVariants.length > 0;

    let displayItems = hasVariants ? [...allVariants] : [...products];

    // Filter by type (variants only)
    if (hasVariants && activeType !== 'All') {
        displayItems = displayItems.filter(v => v.type === activeType);
    }

    // Filter in-stock
    if (showInStock) {
        displayItems = hasVariants
            ? displayItems.filter(v => v.stock > 0)
            : displayItems.filter(p => (p.variants || []).some(v => v.stock > 0));
    }

    // Sort
    if (sortBy === 'price-asc') {
        displayItems = [...displayItems].sort((a, b) => {
            const aPrice = hasVariants ? (a.product.basePrice + (a.priceAdjustment || 0)) : a.basePrice;
            const bPrice = hasVariants ? (b.product.basePrice + (b.priceAdjustment || 0)) : b.basePrice;
            return aPrice - bPrice;
        });
    } else if (sortBy === 'price-desc') {
        displayItems = [...displayItems].sort((a, b) => {
            const aPrice = hasVariants ? (a.product.basePrice + (a.priceAdjustment || 0)) : a.basePrice;
            const bPrice = hasVariants ? (b.product.basePrice + (b.priceAdjustment || 0)) : b.basePrice;
            return bPrice - aPrice;
        });
    } else if (sortBy === 'name-asc') {
        displayItems = [...displayItems].sort((a, b) => {
            const aName = hasVariants ? a.product.name : a.name;
            const bName = hasVariants ? b.product.name : b.name;
            return aName.localeCompare(bName);
        });
    }

    return (
        <div className="shop-page">
            <div className="container">
                {/* Page header */}
                <div className="shop-header">
                    <h1>All Products</h1>
                    <p>Eco-friendly shoe care for every lifestyle</p>
                </div>

                {/* Toolbar */}
                {!loading && hasVariants && (
                    <div className="collection-toolbar">
                        <div className="toolbar-pills">
                            {['All', 'Standard', 'Premium', 'Deluxe'].map(type => (
                                <button
                                    key={type}
                                    className={`pill-btn ${activeType === type ? 'active' : ''}`}
                                    onClick={() => setActiveType(type)}
                                >
                                    {type === 'All' ? '🛒 All' : `${typeIcons[type]} ${type}`}
                                </button>
                            ))}
                        </div>
                        <div className="toolbar-controls">
                            <label className="stock-toggle">
                                <input
                                    type="checkbox"
                                    checked={showInStock}
                                    onChange={e => setShowInStock(e.target.checked)}
                                />
                                In Stock Only
                            </label>
                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="default">Sort By: Default</option>
                                <option value="price-asc">Price: Low → High</option>
                                <option value="price-desc">Price: High → Low</option>
                                <option value="name-asc">Name: A → Z</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="flex-center" style={{ padding: '80px 0' }}>
                        <div className="spinner"></div>
                    </div>
                ) : displayItems.length === 0 ? (
                    <div className="shop-empty">
                        <p>No products match your filters.</p>
                        <button className="pill-btn active" onClick={() => { setActiveType('All'); setShowInStock(false); }}>
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="shop-grid">
                        {hasVariants ? displayItems.map((variant, i) => {
                            const finalPrice = variant.product.basePrice + (variant.priceAdjustment || 0);
                            const imgUrl = getProductImage(variant.product);
                            return (
                                <div key={variant._id || i} className="shop-card">
                                    <div className="shop-card-img">
                                        {imgUrl
                                            ? <img src={imgUrl} alt={variant.product.name} />
                                            : <span className="shop-card-icon">👟</span>
                                        }
                                        <div className="shop-card-badge">{variant.size}</div>
                                    </div>
                                    <div className="shop-card-body">
                                        <div className="shop-card-fragrance">🌸 {variant.fragrance}</div>
                                        <h3 className="shop-card-name">{variant.product.name}</h3>
                                        <p className="shop-card-sub">{variant.type} · {variant.size}</p>
                                        <div className="shop-card-bottom">
                                            <span className="shop-card-price">₹{finalPrice}</span>
                                            <span className={`shop-card-stock ${variant.stock > 0 ? 'in' : 'out'}`}>
                                                {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                            </span>
                                        </div>
                                        <Link to={`/product/${variant.product._id}`} className="shop-card-btn">
                                            View Product →
                                        </Link>
                                    </div>
                                </div>
                            );
                        }) : displayItems.map(product => {
                            const imgUrl = getProductImage(product);
                            return (
                                <div key={product._id} className="shop-card">
                                    <div className="shop-card-img">
                                        {imgUrl
                                            ? <img src={imgUrl} alt={product.name} />
                                            : <span className="shop-card-icon">👟</span>
                                        }
                                    </div>
                                    <div className="shop-card-body">
                                        <h3 className="shop-card-name">{product.name}</h3>
                                        <p className="shop-card-sub">{product.category}</p>
                                        <div className="shop-card-bottom">
                                            <span className="shop-card-price">₹{product.basePrice}</span>
                                        </div>
                                        <Link to={`/product/${product._id}`} className="shop-card-btn">
                                            View Product →
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Shop;
