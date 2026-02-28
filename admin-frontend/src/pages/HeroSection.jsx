import { useState, useEffect } from 'react';
import { heroAPI } from '../api';

function HeroSection() {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const emptyForm = {
        title: '',
        subtitle: '',
        ctaText: 'Shop Now',
        ctaLink: '/#products',
        bgColor: '#f5f0eb',
        order: 0,
        isActive: true,
        image: null
    };

    const [form, setForm] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await heroAPI.getAll();
            setSlides(res.data.slides);
        } catch (err) {
            setError('Failed to load hero slides');
        } finally {
            setLoading(false);
        }
    };

    // Handle both Cloudinary (absolute) and local /uploads URLs
    const getImageSrc = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('subtitle', form.subtitle);
        formData.append('ctaText', form.ctaText);
        formData.append('ctaLink', form.ctaLink);
        formData.append('bgColor', form.bgColor);
        formData.append('order', form.order);
        formData.append('isActive', form.isActive);
        if (form.image instanceof File) {
            formData.append('image', form.image);
        }

        try {
            if (editingSlide) {
                await heroAPI.update(editingSlide._id, formData);
                setSuccess('Slide updated successfully');
            } else {
                await heroAPI.create(formData);
                setSuccess('Slide created successfully');
            }
            setShowModal(false);
            setEditingSlide(null);
            setForm(emptyForm);
            setImagePreview(null);
            fetchSlides();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (slide) => {
        setEditingSlide(slide);
        setForm({
            title: slide.title,
            subtitle: slide.subtitle || '',
            ctaText: slide.ctaText || 'Shop Now',
            ctaLink: slide.ctaLink || '/#products',
            bgColor: slide.bgColor || '#f5f0eb',
            order: slide.order || 0,
            isActive: slide.isActive,
            image: null
        });
        setImagePreview(slide.image ? getImageSrc(slide.image) : null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;
        try {
            await heroAPI.delete(id);
            setSuccess('Slide deleted');
            fetchSlides();
        } catch (err) {
            setError('Failed to delete slide');
        }
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
                        <h2>Hero Section</h2>
                        <p>Manage landing page carousel slides</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingSlide(null); setForm(emptyForm); setImagePreview(null); setShowModal(true); }}>
                        + Add Slide
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
                                <th>Slide</th>
                                <th>CTA</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slides.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }} className="text-muted">No slides found. Add your first hero slide!</td></tr>
                            ) : slides.map(slide => (
                                <tr key={slide._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '100px',
                                                height: '60px',
                                                background: slide.bgColor,
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #eee'
                                            }}>
                                                {slide.image && (
                                                    <img
                                                        src={getImageSrc(slide.image)}
                                                        alt=""
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <strong>{slide.title}</strong>
                                                <div className="text-sm text-muted">{slide.subtitle}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            <strong>{slide.ctaText}</strong>
                                            <div className="text-muted">{slide.ctaLink}</div>
                                        </div>
                                    </td>
                                    <td>{slide.order}</td>
                                    <td>
                                        <span className={`badge ${slide.isActive ? 'badge-delivered' : 'badge-cancelled'}`}>
                                            {slide.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(slide)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(slide._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingSlide ? 'Edit Slide' : 'Add Hero Slide'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Keep Your Kicks Fresh" />
                            </div>
                            <div className="form-group">
                                <label>Subtitle</label>
                                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="e.g. Naturally" />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>CTA Text</label>
                                    <input type="text" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>CTA Link</label>
                                    <input type="text" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Background Color</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid #ddd' }} />
                                        <input type="text" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Display Order</label>
                                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Image</label>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                                    {imagePreview && (
                                        <div style={{ width: '120px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eee' }}>
                                            <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                        {imagePreview ? 'Change Image' : 'Choose Image'}
                                        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                                    Active (Shown on landing page)
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingSlide ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HeroSection;
