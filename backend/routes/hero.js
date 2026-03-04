import express from 'express';
import HeroSlide from '../models/HeroSlide.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadHero, cloudinary } from '../middleware/upload.js';

const router = express.Router();

/* ── Default slide data ───────────────────────────────────── */
const DEFAULTS = [
    { slideIndex: 0, bg: '#D6F2FF', badgeText: 'SPF 50 | PA++++', headline: 'Shield Your Skin\nThis Summer', cta: 'Shop Now →' },
    { slideIndex: 1, bg: '#FFF3EC', badgeText: 'FREE Kit on orders above ₹599', headline: 'Your Routine,\nAnywhere', cta: 'Shop Now →' },
    { slideIndex: 2, bg: '#F5F5F0', badgeText: 'FREE Face Towel on orders above ₹899', headline: 'Cleanse.\nTreat. Glow.', cta: 'Shop Now →' },
];

function buildSlides(dbDocs) {
    return DEFAULTS.map(def => {
        const doc = dbDocs.find(d => d.slideIndex === def.slideIndex);
        if (!doc) return { ...def, image: '', imagePublicId: '', isActive: true };
        return {
            slideIndex: doc.slideIndex,
            bg: doc.bg || def.bg,
            badgeText: doc.badgeText || def.badgeText,
            headline: doc.headline || def.headline,
            cta: doc.cta || def.cta,
            image: doc.image || '',
            imagePublicId: doc.imagePublicId || '',
            isActive: doc.isActive,
            _id: doc._id,
            updatedAt: doc.updatedAt,
        };
    });
}

/* ─────────────────────────────────────────────────────────────
   GET /hero  — public
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
    try {
        const docs = await HeroSlide.find({}).sort({ slideIndex: 1 });
        res.json({ success: true, slides: buildSlides(docs) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

/* ─────────────────────────────────────────────────────────────
   GET /hero/all  — admin
─────────────────────────────────────────────────────────────── */
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const docs = await HeroSlide.find({}).sort({ slideIndex: 1 });
        res.json({ success: true, slides: buildSlides(docs) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

/* ─────────────────────────────────────────────────────────────
   POST /hero  — admin, upsert one slide
   Body fields: slideIndex (0/1/2), bg, badgeText, headline, cta, isActive
   File field : image (optional)
─────────────────────────────────────────────────────────────── */
router.post('/', verifyToken, requireAdmin, (req, res) => {
    uploadHero(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
        }

        try {
            const { slideIndex: rawIndex, bg, badgeText, headline, cta, isActive } = req.body;
            const slideIndex = parseInt(rawIndex, 10);

            if (isNaN(slideIndex) || slideIndex < 0 || slideIndex > 2) {
                return res.status(400).json({ success: false, message: 'slideIndex must be 0, 1, or 2' });
            }

            const updateData = { slideIndex };
            if (bg !== undefined) updateData.bg = bg;
            if (badgeText !== undefined) updateData.badgeText = badgeText;
            if (headline !== undefined) updateData.headline = headline;
            if (cta !== undefined) updateData.cta = cta;
            updateData.isActive = !(isActive === 'false' || isActive === false);

            // Handle image upload — delete old Cloudinary asset first
            if (req.file) {
                const existing = await HeroSlide.findOne({ slideIndex });
                if (existing?.imagePublicId) {
                    try { await cloudinary.uploader.destroy(existing.imagePublicId); } catch (_) { /* ok */ }
                }
                updateData.image = req.file.path;
                updateData.imagePublicId = req.file.filename;
            }

            const slide = await HeroSlide.findOneAndUpdate(
                { slideIndex },
                { $set: updateData },
                { new: true, upsert: true }
            );

            res.json({ success: true, slide });
        } catch (err) {
            console.error('Hero slide save error:', err.message);
            res.status(500).json({ success: false, message: err.message || 'Failed to save slide' });
        }
    });
});

/* ─────────────────────────────────────────────────────────────
   DELETE /hero/image  — admin, remove image for a slide
   Body: { slideIndex: 0 | 1 | 2 }
─────────────────────────────────────────────────────────────── */
router.delete('/image', verifyToken, requireAdmin, async (req, res) => {
    try {
        const slideIndex = parseInt(req.body.slideIndex ?? req.query.slideIndex, 10);
        if (isNaN(slideIndex)) return res.status(400).json({ success: false, message: 'slideIndex required' });

        const slide = await HeroSlide.findOne({ slideIndex });
        if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

        if (slide.imagePublicId) {
            try { await cloudinary.uploader.destroy(slide.imagePublicId); } catch (_) { /* ok */ }
        }
        slide.image = '';
        slide.imagePublicId = '';
        await slide.save();

        res.json({ success: true, slide });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to remove image' });
    }
});

export default router;
