import { useState, useEffect } from 'react';
import { heroAPI } from '../api';

/* ── Per-slide defaults (mirrors HeroSlider.jsx) ─────────── */
const SLIDE_DEFAULTS = [
    { bg: '#D6F2FF', badgeText: 'SPF 50 | PA++++', headline: 'Shield Your Skin\nThis Summer', cta: 'Shop Now →', image: '', isActive: true },
    { bg: '#FFF3EC', badgeText: 'FREE Kit on orders above ₹599', headline: 'Your Routine,\nAnywhere', cta: 'Shop Now →', image: '', isActive: true },
    { bg: '#F5F5F0', badgeText: 'FREE Face Towel on orders above ₹899', headline: 'Cleanse.\nTreat. Glow.', cta: 'Shop Now →', image: '', isActive: true },
];

const LABELS = ['Slide 1', 'Slide 2', 'Slide 3'];

/* ── Small live preview ──────────────────────────────────── */
function SlidePreview({ slide, preview }) {
    return (
        <div style={{
            display: 'flex',
            borderRadius: '12px',
            overflow: 'hidden',
            height: '220px',
            background: slide.bg || '#f0f0f0',
            border: '1px solid #e5e5e5',
        }}>
            {/* Image side */}
            <div style={{ flex: '0 0 55%', overflow: 'hidden', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {preview ? (
                    <img src={preview} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <span style={{ color: '#aaa', fontSize: '13px' }}>No image</span>
                )}
            </div>
            {/* Content side */}
            <div style={{ flex: '0 0 45%', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                <span style={{
                    display: 'inline-block', width: 'fit-content',
                    background: '#1a1a1a', color: '#fff',
                    fontSize: '9px', fontWeight: 700,
                    letterSpacing: '0.8px', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '50px',
                }}>
                    {slide.badgeText || 'Badge text'}
                </span>
                <p style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '15px', fontWeight: 700,
                    lineHeight: 1.2, color: '#1a1a1a', margin: 0,
                    whiteSpace: 'pre-line',
                }}>
                    {slide.headline || 'Headline'}
                </p>
                <span style={{
                    display: 'inline-block', width: 'fit-content',
                    background: '#1a1a1a', color: '#fff',
                    fontSize: '10px', fontWeight: 600,
                    letterSpacing: '1px', textTransform: 'uppercase',
                    padding: '6px 14px', borderRadius: '50px',
                }}>
                    {slide.cta || 'Shop Now →'}
                </span>
            </div>
        </div>
    );
}

/* ── Main component ──────────────────────────────────────── */
function HeroSection() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // null means "creating new"
    const [formData, setFormData] = useState({
        bg: '#D6F2FF',
        badgeText: 'New Arrival',
        headline: '',
        cta: 'Shop Now →',
        isActive: true,
        order: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [saving, setSaving] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    useEffect(() => { fetchSlides(); }, []);

    useEffect(() => {
        if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
    }, [success]);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const res = await heroAPI.getAll();
            setSlides(res.data.slides || []);
        } catch (err) {
            setError('Failed to load hero slides');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (slide = null) => {
        if (slide) {
            setEditingId(slide._id);
            setFormData({
                bg: slide.bg || '#D6F2FF',
                badgeText: slide.badgeText || '',
                // Read headline first, fall back to title for legacy slides
                headline: slide.headline || slide.title || '',
                cta: slide.cta || 'Shop Now →',
                isActive: slide.isActive ?? true,
                order: slide.order ?? 0
            });
            setPreviewUrl(slide.image ? (slide.image.startsWith('http') ? slide.image : `${API_BASE}${slide.image}`) : '');
        } else {
            setEditingId(null);
            setFormData({
                bg: '#D6F2FF',
                badgeText: 'New Arrival',
                headline: '',
                cta: 'Shop Now →',
                isActive: true,
                order: slides.length
            });
            setPreviewUrl('');
        }
        setSelectedFile(null);
        setShowForm(true);
        setError('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const fd = new FormData();
        Object.keys(formData).forEach(key => fd.append(key, formData[key]));
        fd.append('title', formData.headline); // keep title in sync with headline for legacy
        if (selectedFile) fd.append('image', selectedFile);

        console.log('[HeroSection] Saving slide:', editingId || 'NEW', Object.fromEntries(fd));

        try {
            if (editingId) {
                await heroAPI.update(editingId, fd);
                setSuccess('Slide updated successfully');
            } else {
                await heroAPI.create(fd);
                setSuccess('New slide created successfully');
            }
            setShowForm(false);
            await fetchSlides(); // await so fresh data is loaded before user re-opens form
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slide?')) return;
        try {
            await heroAPI.delete(id);
            setSuccess('Slide deleted');
            fetchSlides();
        } catch (err) {
            setError('Failed to delete slide');
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h2>Hero Section</h2>
                        <p>Manage dynamic slides for your main website landing page</p>
                    </div>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
                            + Add New Slide
                        </button>
                    )}
                </div>
            </div>

            {success && <div className="success-msg" style={{ marginBottom: 20 }}>{success}</div>}
            {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

            {showForm ? (
                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                            {editingId ? 'Edit Hero Slide' : 'Create New Hero Slide'}
                        </h3>
                        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Order / Sequence</label>
                                    <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Background Colour</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type="color" value={formData.bg} onChange={e => setFormData({ ...formData, bg: e.target.value })} style={{ width: 45, height: 38, padding: 2 }} />
                                        <input type="text" value={formData.bg} onChange={e => setFormData({ ...formData, bg: e.target.value })} style={{ flex: 1 }} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Badge Chip Text</label>
                                <input type="text" value={formData.badgeText} onChange={e => setFormData({ ...formData, badgeText: e.target.value })} placeholder="SPF 50 | PA++++" />
                            </div>

                            <div className="form-group">
                                <label>Headline</label>
                                <textarea rows={3} value={formData.headline} onChange={e => setFormData({ ...formData, headline: e.target.value })} placeholder="Main title of the slide" />
                            </div>

                            <div className="form-group">
                                <label>CTA Button Text</label>
                                <input type="text" value={formData.cta} onChange={e => setFormData({ ...formData, cta: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Slide Image</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                                <small className="text-muted">Recommended: Transparent PNG or high-quality product image</small>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                    Active (show on website)
                                </label>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={saving}>
                                {saving ? 'Saving...' : (editingId ? '💾  Update Slide' : '🚀  Create Slide')}
                            </button>
                        </form>

                        <div>
                            <h4 style={{ marginBottom: 16, fontSize: '14px', textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}>
                                Live Preview
                            </h4>
                            <SlidePreview slide={formData} preview={previewUrl} />
                            <p style={{ marginTop: 12, fontSize: '12px', color: '#888', textAlign: 'center' }}>
                                Visual approximation of the final slide
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    {slides.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>
                            <div style={{ fontSize: 48, marginBottom: 20 }}>🎬</div>
                            <h3>No Slides Yet</h3>
                            <p style={{ marginBottom: 20 }}>Your hero section is empty. Let's create something beautiful.</p>
                            <button className="btn btn-primary" onClick={() => handleOpenForm()}>Add First Slide</button>
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 80 }}>Order</th>
                                    <th style={{ width: 120 }}>Preview</th>
                                    <th>Headline</th>
                                    <th style={{ width: 100 }}>Status</th>
                                    <th style={{ width: 150, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slides.map(s => (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 700 }}>{s.order}</td>
                                        <td>
                                            <div style={{ width: 80, height: 50, borderRadius: 4, background: s.bg || '#eee', overflow: 'hidden' }}>
                                                {s.image && (
                                                    <img
                                                        src={s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`}
                                                        alt=""
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.headline || '(No headline)'}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>{s.badgeText}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {s.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenForm(s)}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" style={{ color: '#e53e3e' }} onClick={() => handleDelete(s._id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default HeroSection;
