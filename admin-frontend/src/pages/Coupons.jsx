import { useState, useEffect } from 'react';
import { couponAPI } from '../api';

function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const emptyForm = {
        code: '',
        discountType: 'percentage',
        value: 0,
        minPurchaseAmount: 0,
        expiryDate: '',
        usageLimit: '',
        isActive: true
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await couponAPI.getAll();
            setCoupons(res.data.coupons);
        } catch (err) {
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const payload = {
            ...form,
            usageLimit: form.usageLimit === '' ? null : parseInt(form.usageLimit),
            expiryDate: form.expiryDate === '' ? null : form.expiryDate
        };

        try {
            if (editingCoupon) {
                await couponAPI.update(editingCoupon._id, payload);
                setSuccess('Coupon updated successfully');
            } else {
                await couponAPI.create(payload);
                setSuccess('Coupon created successfully');
            }
            setShowModal(false);
            setEditingCoupon(null);
            setForm(emptyForm);
            fetchCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save coupon');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            minPurchaseAmount: coupon.minPurchaseAmount || 0,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
            usageLimit: coupon.usageLimit === null ? '' : coupon.usageLimit,
            isActive: coupon.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await couponAPI.delete(id);
            setSuccess('Coupon deleted');
            fetchCoupons();
        } catch (err) {
            setError('Failed to delete coupon');
        }
    };

    const handleToggleActive = async (coupon) => {
        try {
            await couponAPI.update(coupon._id, { ...coupon, isActive: !coupon.isActive });
            setSuccess(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
            fetchCoupons();
        } catch (err) {
            setError('Failed to update coupon status');
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
                        <h2>Coupons & Discounts</h2>
                        <p>Manage promo codes and discount offers</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingCoupon(null); setForm(emptyForm); setShowModal(true); }}>
                        + Create Coupon
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
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Min. Purchase</th>
                                <th>Usage</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 40 }} className="text-muted">
                                        No coupons yet. Create your first discount code!
                                    </td>
                                </tr>
                            ) : coupons.map(coupon => (
                                <tr key={coupon._id}>
                                    <td>
                                        <code style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#22c55e' }}>{coupon.code}</code>
                                    </td>
                                    <td>
                                        {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                    </td>
                                    <td>₹{coupon.minPurchaseAmount}</td>
                                    <td className="text-sm">
                                        {coupon.usageCount} / {coupon.usageLimit || '∞'}
                                    </td>
                                    <td className="text-sm text-muted">
                                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${coupon.isActive ? 'badge-delivered' : 'badge-cancelled'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleToggleActive(coupon)}
                                            title="Click to toggle"
                                        >
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(coupon)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(coupon._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Coupon Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-2 gap-16">
                                <div className="form-group">
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        style={{ textTransform: 'uppercase' }}
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="e.g. SAVE10"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Discount Type</label>
                                    <select
                                        value={form.discountType}
                                        onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-2 gap-16">
                                <div className="form-group">
                                    <label>Value *</label>
                                    <input
                                        type="number"
                                        value={form.value}
                                        onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Min. Purchase (₹)</label>
                                    <input
                                        type="number"
                                        value={form.minPurchaseAmount}
                                        onChange={(e) => setForm({ ...form, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-2 gap-16">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input
                                        type="date"
                                        value={form.expiryDate}
                                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Usage Limit (Total)</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    Active (Accept payments using this code)
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Coupons;
