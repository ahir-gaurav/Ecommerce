import { useState, useEffect } from 'react';
import { userAPI } from '../api';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await userAPI.getAll();
            setUsers(res.data.users);
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Users</h2>
                <p>{users.length} registered users</p>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="card">
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Verified</th>
                                <th>Addresses</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }} className="text-muted">No users found</td></tr>
                            ) : users.map(user => (
                                <tr key={user._id}>
                                    <td><strong>{user.name}</strong></td>
                                    <td className="text-sm">{user.email}</td>
                                    <td className="text-sm text-muted">{user.phone || '—'}</td>
                                    <td>
                                        <span className={`badge ${user.isVerified ? 'badge-delivered' : 'badge-cancelled'}`}>
                                            {user.isVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td>{user.addresses?.length || 0}</td>
                                    <td className="text-sm text-muted">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Users;
