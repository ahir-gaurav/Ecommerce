import { useState, useEffect } from 'react';
import { productAPI, fragranceAPI } from '../api';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fragrances, setFragrances] = useState([]);

    const emptyForm = {
        name: 'Kicks Don\'t Stink - Eco Shoe Deodoriser',
        description: 'A sustainable, biodegradable, reusable shoe deodoriser made from activated bamboo charcoal, cedar shavings, and lavender buds.',
        category: 'Eco-Friendly Home Care',
        basePrice: '',
    };

    const emptyVariant = {
        type: 'Standard',
        size: 'Medium',
        fragrance: '',
        priceAdjustment: 0,
        stock: 0,
        sku: ''
    };

    const [form, setForm] = useState(emptyForm);
    const [variantForm, setVariantForm] = useState(emptyVariant);

    const [showImageModal, setShowImageModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchFragrances();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.getAll();
            setProducts(res.data.products);
        } catch (err) {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchFragrances = async () => {
        try {
            const res = await fragranceAPI.getAll();
            const list = res.data.fragrances || [];
            setFragrances(list);
            // Set the first fragrance as default if available
            if (list.length > 0) {
                setVariantForm(v => ({ ...v, fragrance: list[0].name }));
            }
        } catch (err) {
            // Fall back to hardcoded if API fails
            setFragrances([]);
        }
    };

    // Returns a usable image src — handles both Cloudinary (http) and local (/uploads) URLs
    const getImageSrc = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
    };

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        setUploading(true);
        setError('');
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        try {
            await productAPI.uploadImages(selectedProduct._id, formData);
            setSuccess('Images uploaded successfully');
            const res = await productAPI.getAll();
            const updatedProducts = res.data.products;
            setProducts(updatedProducts);
            setSelectedProduct(updatedProducts.find(p => p._id === selectedProduct._id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleImageDelete = async (imageId) => {
        if (!confirm('Are you sure you want to delete this image?')) return;
        setUploading(true);
        try {
            await productAPI.deleteImage(selectedProduct._id, imageId);
            setSuccess('Image deleted');
            const res = await productAPI.getAll();
            const updatedProducts = res.data.products;
            setProducts(updatedProducts);
            setSelectedProduct(updatedProducts.find(p => p._id === selectedProduct._id));
        } catch (err) {
            setError('Failed to delete image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingProduct) {
                await productAPI.update(editingProduct._id, form);
                setSuccess('Product updated successfully');
            } else {
                await productAPI.create(form);
                setSuccess('Product created successfully');
            }
            setShowModal(false);
            setEditingProduct(null);
            setForm(emptyForm);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            description: product.description,
            category: product.category,
            basePrice: product.basePrice,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await productAPI.delete(id);
            setSuccess('Product deleted');
            fetchProducts();
        } catch (err) {
            setError('Failed to delete product');
        }
    };

    const handleAddVariant = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await productAPI.addVariant(selectedProduct._id, variantForm);
            setSuccess('Variant added successfully');
            setShowVariantModal(false);
            setVariantForm(emptyVariant);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add variant');
        } finally {
            setSaving(false);
        }
    };

    const getTotalStock = (product) => {
        return product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
    };

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(''), 3000);
            return () => clearTimeout(t);
        }
    }, [success]);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h2>Products</h2>
                        <p>Manage your product catalog</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); }}>
                        + Add Product
                    </button>
                </div>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Base Price</th>
                                <th>Variants</th>
                                <th>Total Stock</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }} className="text-muted">No products found. Add your first product!</td></tr>
                            ) : products.map(product => (
                                <tr key={product._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={getImageSrc(product.images[0].url)}
                                                    alt={product.name}
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                                            )}
                                            <div>
                                                <strong>{product.name}</strong>
                                                <div className="text-sm text-muted" style={{ maxWidth: 200 }}>{product.description?.substring(0, 60)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td>₹{product.basePrice}</td>
                                    <td>{product.variants?.length || 0}</td>
                                    <td>
                                        <span className={`badge ${getTotalStock(product) <= 10 ? 'badge-cancelled' : 'badge-delivered'}`}>
                                            {getTotalStock(product)}
                                        </span>
                                    </td>
                                    <td>⭐ {product.averageRating?.toFixed(1) || '0.0'} ({product.totalReviews || 0})</td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(product)}>Edit</button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedProduct(product); setShowImageModal(true); }}>Images</button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                                setSelectedProduct(product);
                                                const defaultFragrance = fragrances.length > 0 ? fragrances[0].name : '';
                                                setVariantForm({ ...emptyVariant, fragrance: defaultFragrance });
                                                setShowVariantModal(true);
                                            }}>+ Variant</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Base Price (₹)</label>
                                    <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) })} required min="0" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Management Modal */}
            {showImageModal && (
                <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Manage Images — {selectedProduct?.name}</h3>
                        <div style={{ marginBottom: 20 }}>
                            <label className="btn btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                                {uploading ? 'Processing...' : '+ Upload Images'}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    hidden
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                            {selectedProduct?.images?.map((img) => (
                                <div key={img._id} style={{ position: 'relative', aspectRatio: '1', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img
                                        src={getImageSrc(img.url)}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <button
                                        onClick={() => handleImageDelete(img._id)}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(198, 40, 40, 0.8)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }}
                                        disabled={uploading}
                                    >✕</button>
                                </div>
                            ))}
                            {(!selectedProduct?.images || selectedProduct.images.length === 0) && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', border: '2px dashed #eee', borderRadius: '8px', color: '#999' }}>
                                    No images uploaded yet.
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setShowImageModal(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Variant Modal */}
            {showVariantModal && (
                <div className="modal-overlay" onClick={() => setShowVariantModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add Variant — {selectedProduct?.name}</h3>
                        <form onSubmit={handleAddVariant}>
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select value={variantForm.type} onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value })}>
                                        <option>Standard</option>
                                        <option>Premium</option>
                                        <option>Deluxe</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Size</label>
                                    <select value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}>
                                        <option>Small</option>
                                        <option>Medium</option>
                                        <option>Large</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fragrance</label>
                                    <select value={variantForm.fragrance} onChange={(e) => setVariantForm({ ...variantForm, fragrance: e.target.value })}>
                                        {fragrances.length > 0 ? (
                                            fragrances.map(f => (
                                                <option key={f._id} value={f.name}>{f.name}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option>Lavender</option>
                                                <option>Cedar</option>
                                                <option>Unscented</option>
                                                <option>Mixed</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input type="text" value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} required placeholder="KDS-STD-M-LAV" />
                                </div>
                                <div className="form-group">
                                    <label>Price Adjustment (₹)</label>
                                    <input type="number" value={variantForm.priceAdjustment} onChange={(e) => setVariantForm({ ...variantForm, priceAdjustment: parseFloat(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Stock</label>
                                    <input type="number" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) })} required min="0" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowVariantModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Adding...' : 'Add Variant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;
