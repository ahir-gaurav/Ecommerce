import { useState, useEffect } from 'react';
import { heroAPI } from '../api';

const DEFAULTS = {
    badgeText: '🌿 100% Eco-Friendly Shoe Care',
    title: 'Keep Your Kicks',
    highlightText: 'Naturally Fresh',
    description: 'Bamboo charcoal, cedar & lavender — zero chemicals, 100% biodegradable. Reusable for months.',
    image: '',
    isActive: true,
};

function HeroSection() {
    const [form, setForm] = useState(DEFAULTS);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    useEffect(() => { fetchConfig(); }, []);

    const fetchConfig = async () => {
        try {
            const res = await heroAPI.getConfig();
            const cfg = res.data.config;
            if (cfg) {
                setForm({
                    badgeText: cfg.badgeText || DEFAULTS.badgeText,
                    title: cfg.title || DEFAULTS.title,
                    highlightText: cfg.highlightText || DEFAULTS.highlightText,
                    description: cfg.description || DEFAULTS.description,
                    image: cfg.image || '',
                    isActive: cfg.isActive ?? true,
                });
                if (cfg.image) {
                    setImagePreview(cfg.image.startsWith('http') ? cfg.image : `${API_BASE}${cfg.image}`);
                }
            }
        } catch (err) {
            setError('Failed to load hero config');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(f => ({ ...f, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const fd = new FormData();
        fd.append('badgeText', form.badgeText);
        fd.append('title', form.title);
        fd.append('highlightText', form.highlightText);
        fd.append('description', form.description);
        fd.append('isActive', form.isActive);
        if (form.image instanceof File) fd.append('image', form.image);
        try {
            await heroAPI.save(fd);
            setSuccess('Hero section saved!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
    }, [success]);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h2>Hero Section</h2>
                        <p>Edit the landing page hero content</p>
                    </div>
                </div>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* ── Editor Form ── */}
                <div className="card">
                    <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: '700' }}>Edit Content</h3>
                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label>Badge Text</label>
                            <input
                                type="text"
                                value={form.badgeText}
                                onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))}
                                placeholder="🌿 100% Eco-Friendly Shoe Care"
                            />
                            <small className="text-muted">Small label shown above the heading</small>
                        </div>

                        <div className="form-group">
                            <label>Heading (plain part)</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Keep Your Kicks"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Highlighted Text <span style={{ color: '#22c55e' }}>(green gradient)</span></label>
                            <input
                                type="text"
                                value={form.highlightText}
                                onChange={e => setForm(f => ({ ...f, highlightText: e.target.value }))}
                                placeholder="Naturally Fresh"
                            />
                            <small className="text-muted">This part of the heading appears in green</small>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Bamboo charcoal, cedar & lavender..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Hero Card Image</label>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                {imagePreview && (
                                    <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0 }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <label className="btn btn-secondary" style={{ cursor: 'pointer', alignSelf: 'center' }}>
                                    {imagePreview ? 'Change Image' : 'Upload Image'}
                                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                </label>
                            </div>
                            <small className="text-muted">Image displayed inside the 3D parallax card</small>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                />
                                Active (Show hero section on landing page)
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
                            {saving ? 'Saving...' : '💾  Save Hero Section'}
                        </button>
                    </form>
                </div>

                {/* ── Live Preview ── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: '600', color: '#555' }}>
                        Live Preview
                    </div>
                    <div style={{
                        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d1f0d 100%)',
                        padding: '40px 32px',
                        minHeight: '360px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '16px',
                    }}>
                        {/* Badge */}
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: '#6ee77a',
                        }}>
                            {form.badgeText || '🌿 Badge text'}
                        </p>

                        {/* Heading */}
                        <h2 style={{
                            fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                            fontWeight: '800',
                            lineHeight: '1.2',
                            color: '#ffffff',
                            margin: 0,
                        }}>
                            {form.title || 'Heading'}{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #6ee77a, #22c55e)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                {form.highlightText || 'Highlight'}
                            </span>
                        </h2>

                        {/* Description */}
                        <p style={{ color: '#9ca3af', fontSize: '13px', maxWidth: '340px', lineHeight: '1.7', margin: 0 }}>
                            {form.description || 'Description text...'}
                        </p>

                        {/* Buttons preview */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                            <span style={{
                                padding: '10px 24px',
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                color: '#fff',
                                borderRadius: '50px',
                                fontWeight: '700',
                                fontSize: '13px',
                            }}>Shop Now →</span>
                            <span style={{
                                padding: '10px 24px',
                                background: 'transparent',
                                color: '#fff',
                                borderRadius: '50px',
                                fontWeight: '600',
                                fontSize: '13px',
                                border: '2px solid rgba(255,255,255,0.2)',
                            }}>View Collection</span>
                        </div>

                        {/* Image preview card */}
                        {imagePreview && (
                            <div style={{
                                marginTop: '12px',
                                width: '100%',
                                maxWidth: '320px',
                                height: '160px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <img src={imagePreview} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default HeroSection;
