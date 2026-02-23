import { useState, useEffect } from 'react';
import { orderAPI } from '../api';

const STATUSES = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderAPI.getAll();
            setOrders(res.data.orders);
        } catch (err) {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus) return;
        setUpdating(true);
        try {
            await orderAPI.updateStatus(selectedOrder._id, { status: newStatus, note: statusNote });
            setSuccess('Order status updated');
            setSelectedOrder(null);
            setNewStatus('');
            setStatusNote('');
            fetchOrders();
        } catch (err) {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const filtered = filter === 'All' ? orders : orders.filter(o => o.orderStatus === filter);

    const getBadgeClass = (status) => {
        const map = {
            'Pending': 'badge-pending',
            'Confirmed': 'badge-confirmed',
            'Processing': 'badge-processing',
            'Shipped': 'badge-shipped',
            'Delivered': 'badge-delivered',
            'Cancelled': 'badge-cancelled',
            'Completed': 'badge-completed',
            'Failed': 'badge-failed',
            'Refunded': 'badge-refunded'
        };
        return map[status] || 'badge-pending';
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
                <h2>Orders</h2>
                <p>{orders.length} total orders</p>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            <div className="filters-row">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        className={`filter-btn ${filter === s ? 'active' : ''}`}
                        onClick={() => setFilter(s)}
                    >
                        {s} {s !== 'All' && `(${orders.filter(o => o.orderStatus === s).length})`}
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }} className="text-muted">No orders found</td></tr>
                            ) : filtered.map(order => (
                                <tr key={order._id}>
                                    <td className="font-mono text-sm">{order.orderNumber}</td>
                                    <td>
                                        <strong>{order.user?.name || 'N/A'}</strong>
                                        <div className="text-sm text-muted">{order.user?.email}</div>
                                    </td>
                                    <td>{order.items?.length || 0} items</td>
                                    <td><strong>₹{order.pricing?.total?.toLocaleString('en-IN')}</strong></td>
                                    <td><span className={`badge ${getBadgeClass(order.paymentInfo?.status)}`}>{order.paymentInfo?.status}</span></td>
                                    <td><span className={`badge ${getBadgeClass(order.orderStatus)}`}>{order.orderStatus}</span></td>
                                    <td className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedOrder(order); setNewStatus(order.orderStatus); }}>
                                            View / Update
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <h3>Order {selectedOrder.orderNumber}</h3>

                        <div className="flex justify-between items-center mb-16">
                            <div>
                                <div className="text-sm text-muted">Customer</div>
                                <strong>{selectedOrder.user?.name}</strong> — {selectedOrder.user?.email}
                            </div>
                            <span className={`badge ${getBadgeClass(selectedOrder.orderStatus)}`}>
                                {selectedOrder.orderStatus}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="card mb-16" style={{ padding: 16 }}>
                            <h4 style={{ marginBottom: 8, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1 }}>Items</h4>
                            {selectedOrder.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center" style={{ padding: '8px 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div>
                                        <strong>{item.productName}</strong>
                                        <div className="text-sm text-muted">
                                            {typeof item.variantDetails === 'object'
                                                ? `${item.variantDetails.type} - ${item.variantDetails.size} - ${item.variantDetails.fragrance}`
                                                : item.variantDetails
                                            }
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div>{item.quantity} × ₹{item.price}</div>
                                        <div className="text-sm text-muted">₹{(item.quantity * item.price).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pricing */}
                        <div className="card mb-16" style={{ padding: 16 }}>
                            <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                                <span className="text-muted">Subtotal</span>
                                <span>₹{selectedOrder.pricing?.subtotal?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ marginBottom: 4 }}>
                                <span className="text-muted">GST ({selectedOrder.pricing?.gstPercentage}%)</span>
                                <span>₹{selectedOrder.pricing?.gst?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm" style={{ marginBottom: 8 }}>
                                <span className="text-muted">Delivery</span>
                                <span>₹{selectedOrder.pricing?.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                                <strong>Total</strong>
                                <strong>₹{selectedOrder.pricing?.total?.toLocaleString('en-IN')}</strong>
                            </div>
                        </div>

                        {/* Shipping */}
                        <div className="card mb-16" style={{ padding: 16 }}>
                            <h4 style={{ marginBottom: 8, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1 }}>Shipping Address</h4>
                            <div className="text-sm">
                                <p><strong>{selectedOrder.shippingAddress?.fullName}</strong></p>
                                <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                                {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                                <p>📞 {selectedOrder.shippingAddress?.phone}</p>
                            </div>
                        </div>

                        {/* Update Status */}
                        <div className="card" style={{ padding: 16 }}>
                            <h4 style={{ marginBottom: 12, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1 }}>Update Status</h4>
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <input type="text" placeholder="Add a note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                            </div>
                            <div className="flex gap-12">
                                <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating}>
                                    {updating ? 'Updating...' : 'Update Status'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
                            </div>
                        </div>

                        {/* Status History */}
                        {selectedOrder.statusHistory?.length > 0 && (
                            <div className="mt-16">
                                <h4 style={{ marginBottom: 8, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 1 }}>Status History</h4>
                                {selectedOrder.statusHistory.map((h, i) => (
                                    <div key={i} className="flex gap-12 items-center text-sm" style={{ padding: '6px 0' }}>
                                        <span className={`badge ${getBadgeClass(h.status)}`}>{h.status}</span>
                                        <span className="text-muted">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                                        {h.note && <span>— {h.note}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;
