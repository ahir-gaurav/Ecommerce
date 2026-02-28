import { useState, useEffect } from 'react';
import { fragranceAPI } from '../api';

function Fragrances() {
    const [fragrances, setFragrances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFragrance, setEditingFragrance] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const emptyForm = { name: '', description: '', isActive: true };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        fetchFragrances();
    }, []);

    const fetchFragrances = async () => {
        try {
            const res = await fragranceAPI.getAllAdmin();
            setFragrances(res.data.fragrances);
        } catch (err) {
            setError('Failed to load fragrances');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingFragrance) {
                await fragranceAPI.update(editingFragrance._id, form);
                setSuccess('Fragrance updated successfully');
            } else {
                await fragranceAPI.create(form);
                setSuccess('Fragrance created successfully');
            }
            setShowModal(false);
            setEditingFragrance(null);
            setForm(emptyForm);
            fetchFragrances();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save fragrance');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (fragrance) => {
        setEditingFragrance(fragrance);
        setForm({
            name: fragrance.name,
            description: fragrance.description || '',
            isActive: fragrance.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this fragrance?')) return;
        try {
            await fragranceAPI.delete(id);
            setSuccess('Fragrance deleted');
            fetchFragrances();
        } catch (err) {
            setError('Failed to delete fragrance');
        }
    };

    const handleToggleActive = async (fragrance) => {
        try {
            await fragranceAPI.update(fragrance._id, { ...fragrance, isActive: !fragrance.isActive });
            setSuccess(`Fragrance ${fragrance.isActive ? 'deactivated' : 'activated'}`);
            fetchFragrances();
        } catch (err) {
            setError('Failed to update fragrance status');
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
                        <h2>Fragrances</h2>
                        <p>Manage available fragrance options for product variants</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingFragrance(null); setForm(emptyForm); setShowModal(true); }}>
                        + Add Fragrance
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
                                <th>Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fragrances.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 40 }} className="text-muted">
                                        No fragrances yet. Add your first fragrance!
                                    </td>
                                </tr>
                            ) : fragrances.map(fragrance => (
                                <tr key={fragrance._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '24px' }}>🌸</span>
                                            <strong>{fragrance.name}</strong>
                                        </div>
                                    </td>
                                    <td className="text-muted">{fragrance.description || '—'}</td>
                                    <td>
                                        <span
                                            className={`badge ${fragrance.isActive ? 'badge-delivered' : 'badge-cancelled'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleToggleActive(fragrance)}
                                            title="Click to toggle"
                                        >
                                            {fragrance.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-sm text-muted">
                                        {new Date(fragrance.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(fragrance)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(fragrance._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Fragrance Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingFragrance ? 'Edit Fragrance' : 'Add Fragrance'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    placeholder="e.g. Lavender, Cedar, Eucalyptus"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    rows="2"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional: describe the scent profile"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    Active (Available in product variants)
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingFragrance ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Fragrances;
