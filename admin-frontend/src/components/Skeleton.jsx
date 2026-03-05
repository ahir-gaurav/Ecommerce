import React from 'react';
import './Skeleton.css';

const Skeleton = ({ type, count = 1 }) => {
    const items = Array.from({ length: count });

    if (type === 'stat-card') {
        return (
            <>
                {items.map((_, i) => (
                    <div key={i} className="skeleton-card">
                        <div className="skeleton-icon"></div>
                        <div className="skeleton-value"></div>
                        <div className="skeleton-label"></div>
                    </div>
                ))}
            </>
        );
    }

    if (type === 'table-row') {
        return (
            <>
                {items.map((_, i) => (
                    <tr key={i}>
                        <td><div className="skeleton-line" style={{ width: '80%' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '60%' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '40%' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '50%' }}></div></td>
                    </tr>
                ))}
            </>
        );
    }

    return <div className="skeleton-line"></div>;
};

export default Skeleton;
