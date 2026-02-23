import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

function Settings() {
    const [settings, setSettings] = useState({
        gst_percentage: '',
        delivery_charge: '',
        low_stock_threshold: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await adminAPI.getSettings();
            setSettings({
                gst_percentage: res.data.settings?.gst_percentage || '',
                delivery_charge: res.data.settings?.delivery_charge || '',
                low_stock_threshold: res.data.settings?.low_stock_threshold || ''
            });
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await adminAPI.updateSettings({
                gstPercentage: parseFloat(settings.gst_percentage),
                deliveryCharge: parseFloat(settings.delivery_charge),
                lowStockThreshold: parseInt(settings.low_stock_threshold)
            });
            setSuccess('Settings updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(''), 4000);
            return () => clearTimeout(t);
        }
    }, [success]);

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Settings</h2>
                <p>Configure store-wide settings</p>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            <div className="card" style={{ maxWidth: 560 }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>GST Percentage (%)</label>
                        <input
                            type="number"
                            value={settings.gst_percentage}
                            onChange={(e) => setSettings({ ...settings, gst_percentage: e.target.value })}
                            placeholder="e.g. 18"
                            step="0.1"
                            min="0"
                            max="100"
                        />
                    </div>

                    <div className="form-group">
                        <label>Delivery Charge (₹)</label>
                        <input
                            type="number"
                            value={settings.delivery_charge}
                            onChange={(e) => setSettings({ ...settings, delivery_charge: e.target.value })}
                            placeholder="e.g. 50"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Low Stock Threshold</label>
                        <input
                            type="number"
                            value={settings.low_stock_threshold}
                            onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                            placeholder="e.g. 10"
                            min="0"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Settings;
