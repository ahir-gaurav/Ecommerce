import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Verify JWT token
export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Require authenticated user
export const requireAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        req.currentUser = user;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Require admin
export const requireAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.user.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Admin account is inactive'
            });
        }

        req.currentAdmin = admin;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Require owner role
export const requireOwner = (req, res, next) => {
    if (req.currentAdmin.role !== 'Owner') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner privileges required.'
        });
    }
    next();
};
