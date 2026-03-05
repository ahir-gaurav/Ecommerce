import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await adminAPI.getDashboard();
            setData(res.data.dashboard);
        } catch (err) {
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="loading-page">
            <div className="spinner"></div>
            <p style={{ marginTop: 20, color: '#666' }}>Waking up specialized systems...</p>
        </div>
    );

    if (error) return (
        <div className="error-msg" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>⚠️</span>
            {error}
            <button onClick={fetchDashboard} className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Retry Load</button>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your store performance</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green">💰</div>
                    <div className="stat-value">₹{data?.totalRevenue?.toLocaleString('en-IN') || 0}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">📈</div>
                    <div className="stat-value">₹{data?.monthlySales?.toLocaleString('en-IN') || 0}</div>
                    <div className="stat-label">Monthly Sales</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">🛒</div>
                    <div className="stat-value">{data?.ordersToday || 0}</div>
                    <div className="stat-label">Orders Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon accent">📦</div>
                    <div className="stat-value">{data?.totalProducts || 0}</div>
                    <div className="stat-label">Total Products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red">👥</div>
                    <div className="stat-value">{data?.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>🔥 Best Selling Variants</h3>
                    {data?.bestSelling?.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Variant</th>
                                        <th>Sales</th>
                                        <th>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.bestSelling.map((item, i) => (
                                        <tr key={i}>
                                            <td className="truncate" style={{ maxWidth: 120 }}>{item.product}</td>
                                            <td className="text-sm text-muted">{item.variant}</td>
                                            <td><strong>{item.salesCount}</strong></td>
                                            <td>
                                                <span className={`badge ${item.stock <= 10 ? 'badge-cancelled' : 'badge-delivered'}`}>
                                                    {item.stock}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-sm">No sales data yet</p>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>🐌 Slow Moving Variants</h3>
                    {data?.slowMoving?.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Variant</th>
                                        <th>Sales</th>
                                        <th>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.slowMoving.map((item, i) => (
                                        <tr key={i}>
                                            <td className="truncate" style={{ maxWidth: 120 }}>{item.product}</td>
                                            <td className="text-sm text-muted">{item.variant}</td>
                                            <td>{item.salesCount}</td>
                                            <td>{item.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-sm">No slow-moving variants</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
