import express from 'express';
import HeroSlide from '../models/HeroSlide.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadHero, cloudinary } from '../middleware/upload.js';

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /hero  — public, used by user-frontend
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
    try {
        const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, slides });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

/* ─────────────────────────────────────────────────────────────
   GET /hero/all  — admin only
─────────────────────────────────────────────────────────────── */
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const slides = await HeroSlide.find({}).sort({ order: 1 });
        res.json({ success: true, slides });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /hero  — Create new slide
─────────────────────────────────────────────────────────────── */
router.post('/', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        try {
            const { order, bg, badgeText, headline, title, cta, isActive } = req.body;

            const slideData = {
                order: parseInt(order || 0),
                bg: bg || '#D6F2FF',
                headline: headline || '',
                title: title || headline || '',
                cta: cta || 'Shop Now →',
                isActive: isActive !== 'false' && isActive !== false,
            };
            // Only set badgeText if it's a non-empty string;
            // otherwise the Mongoose model default applies.
            if (badgeText && badgeText.trim()) {
                slideData.badgeText = badgeText.trim();
            }

            if (req.file) {
                slideData.image = req.file.path;
                slideData.imagePublicId = req.file.filename;
            }

            const slide = new HeroSlide(slideData);
            await slide.save();
            res.json({ success: true, slide });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });
});

/* ─────────────────────────────────────────────────────────────
   PUT /hero/:id  — Update slide
─────────────────────────────────────────────────────────────── */
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        try {
            const { order, bg, backgroundColor, badgeText, headline, title, cta, isActive } = req.body;
            console.log('[Hero] Updating slide:', req.params.id, { bg, backgroundColor, headline });

            const updateData = {};

            if (order !== undefined) updateData.order = parseInt(order);

            // Handle both 'bg' and 'backgroundColor' for robustness
            if (bg !== undefined) updateData.bg = bg;
            else if (backgroundColor !== undefined) updateData.bg = backgroundColor;

            if (badgeText !== undefined) updateData.badgeText = badgeText;
            if (headline !== undefined || title !== undefined) {
                updateData.headline = headline || title;
                updateData.title = title || headline;
            }
            if (cta !== undefined) updateData.cta = cta;
            if (isActive !== undefined) updateData.isActive = isActive !== 'false' && isActive !== false;

            if (req.file) {
                const existing = await HeroSlide.findById(req.params.id);
                if (existing?.imagePublicId) {
                    try { await cloudinary.uploader.destroy(existing.imagePublicId); } catch (_) { }
                }
                updateData.image = req.file.path;
                updateData.imagePublicId = req.file.filename;
            }

            const slide = await HeroSlide.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
            if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

            console.log('[Hero] Slide updated successfully:', slide._id);
            res.json({ success: true, slide });
        } catch (err) {
            console.error('[Hero] Update error:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    });
});

/* ─────────────────────────────────────────────────────────────
   DELETE /hero/:id  — Remove slide entirely
─────────────────────────────────────────────────────────────── */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const slide = await HeroSlide.findById(req.params.id);
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

        if (slide.imagePublicId) {
            try { await cloudinary.uploader.destroy(slide.imagePublicId); } catch (_) { }
        }

        await HeroSlide.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Slide deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete slide' });
    }
});

export default router;
