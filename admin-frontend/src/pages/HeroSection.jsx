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
    const [slides, setSlides] = useState(SLIDE_DEFAULTS.map(d => ({ ...d })));
    const [previews, setPreviews] = useState(['', '', '']);
    const [files, setFiles] = useState([null, null, null]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    useEffect(() => { fetchSlides(); }, []);

    useEffect(() => {
        if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
    }, [success]);

    /* ── Fetch ─────────────────────────────────────────────── */
    const fetchSlides = async () => {
        try {
            const res = await heroAPI.getAll();
            const apiSlides = res.data.slides || [];
            setSlides(SLIDE_DEFAULTS.map((def, i) => {
                const s = apiSlides[i] || {};
                return {
                    bg: s.bg || def.bg,
                    badgeText: s.badgeText || def.badgeText,
                    headline: s.headline || def.headline,
                    cta: s.cta || def.cta,
                    image: s.image || '',
                    isActive: s.isActive ?? def.isActive,
                    _id: s._id,
                };
            }));
            setPreviews(apiSlides.map(s =>
                s?.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : ''
            ).concat(['', '', '']).slice(0, 3));
        } catch {
            setError('Failed to load hero slides');
        } finally {
            setLoading(false);
        }
    };

    /* ── Field change ──────────────────────────────────────── */
    const handleChange = (field, value) => {
        setSlides(prev => prev.map((s, i) => i === activeTab ? { ...s, [field]: value } : s));
    };

    /* ── Image pick ────────────────────────────────────────── */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const newFiles = [...files];
        newFiles[activeTab] = file;
        setFiles(newFiles);

        const reader = new FileReader();
        reader.onloadend = () => {
            const p = [...previews];
            p[activeTab] = reader.result;
            setPreviews(p);
        };
        reader.readAsDataURL(file);
    };

    /* ── Remove image ──────────────────────────────────────── */
    const handleRemoveImage = async () => {
        if (!slides[activeTab]._id) {
            // Not yet saved — just clear locally
            const p = [...previews]; p[activeTab] = ''; setPreviews(p);
            const f = [...files]; f[activeTab] = null; setFiles(f);
            handleChange('image', '');
            return;
        }
        try {
            await heroAPI.removeImage(activeTab);
            const p = [...previews]; p[activeTab] = ''; setPreviews(p);
            const f = [...files]; f[activeTab] = null; setFiles(f);
            handleChange('image', '');
            setSuccess('Image removed');
        } catch {
            setError('Failed to remove image');
        }
    };

    /* ── Save current slide ────────────────────────────────── */
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const slide = slides[activeTab];
        const fd = new FormData();
        fd.append('slideIndex', activeTab); // ALWAYS APPEND INDEX FIRST for Multer reliability
        fd.append('bg', slide.bg);
        fd.append('badgeText', slide.badgeText);
        fd.append('headline', slide.headline);
        fd.append('title', slide.headline); // Super-senior fix: Send title to satisfy legacy backend validation
        fd.append('cta', slide.cta);
        fd.append('isActive', slide.isActive);
        if (files[activeTab]) fd.append('image', files[activeTab]);

        try {
            const res = await heroAPI.saveSlide(activeTab, fd);
            const saved = res.data.slide;
            // Update _id + image url from server
            setSlides(prev => prev.map((s, i) =>
                i === activeTab ? { ...s, _id: saved._id, image: saved.image } : s
            ));
            if (saved.image) {
                const p = [...previews];
                p[activeTab] = saved.image.startsWith('http') ? saved.image : `${API_BASE}${saved.image}`;
                setPreviews(p);
            }
            const f = [...files]; f[activeTab] = null; setFiles(f);
            setSuccess(`Slide ${activeTab + 1} saved!`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const slide = slides[activeTab];
    const preview = previews[activeTab];

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h2>Hero Section</h2>
                        <p>Edit the 3 hero slides shown on the landing page</p>
                    </div>
                </div>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            {/* ── Slide Tabs ─────────────────────────────── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {LABELS.map((label, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={activeTab === i ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ fontSize: '13px', padding: '8px 18px' }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* ── Editor form ─────────────────────────── */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px', fontSize: '15px', fontWeight: 700 }}>
                        Editing: {LABELS[activeTab]}
                    </h3>
                    <form onSubmit={handleSave}>

                        {/* BG colour */}
                        <div className="form-group">
                            <label>Background Colour</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={slide.bg}
                                    onChange={e => handleChange('bg', e.target.value)}
                                    style={{ width: '48px', height: '36px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', padding: '2px' }}
                                />
                                <input
                                    type="text"
                                    value={slide.bg}
                                    onChange={e => handleChange('bg', e.target.value)}
                                    placeholder="#D6F2FF"
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="form-group">
                            <label>Badge Chip Text</label>
                            <input
                                type="text"
                                value={slide.badgeText}
                                onChange={e => handleChange('badgeText', e.target.value)}
                                placeholder="SPF 50 | PA++++"
                            />
                            <small className="text-muted">Shown in the black pill chip above the headline</small>
                        </div>

                        {/* Headline */}
                        <div className="form-group">
                            <label>Headline</label>
                            <textarea
                                rows={3}
                                value={slide.headline}
                                onChange={e => handleChange('headline', e.target.value)}
                                placeholder={'Shield Your Skin\nThis Summer'}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                            <small className="text-muted">Use a new line to break the headline into two lines</small>
                        </div>

                        {/* CTA */}
                        <div className="form-group">
                            <label>CTA Button Text</label>
                            <input
                                type="text"
                                value={slide.cta}
                                onChange={e => handleChange('cta', e.target.value)}
                                placeholder="Shop Now →"
                            />
                        </div>

                        {/* Image */}
                        <div className="form-group">
                            <label>Slide Image</label>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {preview && (
                                    <div style={{ width: '90px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0 }}>
                                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                    {preview ? 'Change Image' : 'Upload Image'}
                                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                </label>
                                {preview && (
                                    <button type="button" className="btn btn-secondary" style={{ color: '#e53e3e' }} onClick={handleRemoveImage}>
                                        Remove
                                    </button>
                                )}
                            </div>
                            <small className="text-muted">Displayed in the left 60% of the slide</small>
                        </div>

                        {/* Active toggle */}
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={slide.isActive}
                                    onChange={e => handleChange('isActive', e.target.checked)}
                                />
                                Active (show this slide in the hero)
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
                            {saving ? 'Saving...' : `💾  Save ${LABELS[activeTab]}`}
                        </button>
                    </form>
                </div>

                {/* ── Live preview ────────────────────────── */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: 600, color: '#555' }}>
                        Live Preview — {LABELS[activeTab]}
                    </div>
                    <div style={{ padding: '20px' }}>
                        <SlidePreview slide={slide} preview={preview} />
                        <p style={{ marginTop: '12px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
                            This approximates how the slide will look. Actual fonts and sizes may differ slightly.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default HeroSection;
