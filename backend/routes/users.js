import express from 'express';
import { verifyToken, requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, requireAuth, async (req, res) => {
    try {
        res.json({ success: true, user: req.currentUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', verifyToken, requireAuth, async (req, res) => {
    try {
        const { name, phone, emailPreferences } = req.body;

        const user = await User.findByIdAndUpdate(
            req.currentUser._id,
            { name, phone, emailPreferences },
            { new: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// Add address
router.post('/addresses', verifyToken, requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.currentUser._id);
        user.addresses.push(req.body);
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add address' });
    }
});

// Update address
router.put('/addresses/:id', verifyToken, requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.currentUser._id);
        const address = user.addresses.id(req.params.id);

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        Object.assign(address, req.body);
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update address' });
    }
});

// Delete address
router.delete('/addresses/:id', verifyToken, requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.currentUser._id);
        user.addresses.id(req.params.id).remove();
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete address' });
    }
});

export default router;
