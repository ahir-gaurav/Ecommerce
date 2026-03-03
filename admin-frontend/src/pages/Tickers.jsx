import { useState, useEffect } from 'react';
import { tickerAPI } from '../api';

function Tickers() {
    const [tickers, setTickers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTicker, setEditingTicker] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const emptyForm = { text: '', icon: '✨', isActive: true, order: 0 };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetchTickers();
    }, []);

    const fetchTickers = async () => {
        try {
            const res = await tickerAPI.getAllAdmin();
            setTickers(res.data.tickers);
        } catch (err) {
            setError('Failed to load ticker items');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingTicker) {
                await tickerAPI.update(editingTicker._id, form);
                setSuccess('Ticker item updated successfully');
            } else {
                await tickerAPI.create(form);
                setSuccess('Ticker item created successfully');
            }
            setShowModal(false);
            setEditingTicker(null);
            setForm(emptyForm);
            fetchTickers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save ticker item');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (ticker) => {
        setEditingTicker(ticker);
        setForm({
            text: ticker.text,
            icon: ticker.icon || '✨',
            isActive: ticker.isActive,
            order: ticker.order || 0
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this ticker item?')) return;
        try {
            await tickerAPI.delete(id);
            setSuccess('Ticker item deleted');
            fetchTickers();
        } catch (err) {
            setError('Failed to delete ticker item');
        }
    };

    const handleToggleActive = async (ticker) => {
        try {
            await tickerAPI.update(ticker._id, { ...ticker, isActive: !ticker.isActive });
            setSuccess(`Ticker ${ticker.isActive ? 'deactivated' : 'activated'}`);
            fetchTickers();
        } catch (err) {
            setError('Failed to update ticker status');
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
                        <h2>Landing Page Ticker</h2>
                        <p>Manage the rotating information banner on the home page</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingTicker(null); setForm(emptyForm); setShowModal(true); }}>
                        + Add Ticker Item
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
                                <th>Item</th>
                                <th>Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: 40 }} className="text-muted">
                                        No ticker items yet. Add your first announcement!
                                    </td>
                                </tr>
                            ) : tickers.map(ticker => (
                                <tr key={ticker._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '24px' }}>{ticker.icon}</span>
                                            <strong>{ticker.text}</strong>
                                        </div>
                                    </td>
                                    <td className="text-muted">{ticker.order}</td>
                                    <td>
                                        <span
                                            className={`badge ${ticker.isActive ? 'badge-delivered' : 'badge-cancelled'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleToggleActive(ticker)}
                                            title="Click to toggle"
                                        >
                                            {ticker.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(ticker)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ticker._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticker Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingTicker ? 'Edit Ticker Item' : 'Add Ticker Item'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Text *</label>
                                <input
                                    type="text"
                                    value={form.text}
                                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                                    required
                                    placeholder="e.g. 100% Eco-Friendly"
                                />
                            </div>
                            <div className="form-group">
                                <label>Icon (Emoji)</label>
                                <input
                                    type="text"
                                    value={form.icon}
                                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                    placeholder="e.g. 🌿, ✨, ♻️"
                                />
                            </div>
                            <div className="form-group">
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    value={form.order}
                                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    Active (Visible on landing page)
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingTicker ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tickers;
