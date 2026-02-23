import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import HeroSlide from '../models/HeroSlide.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer config for hero images
const heroStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/images');
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const heroUpload = multer({
    storage: heroStorage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP images are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

// GET all active hero slides (public)
router.get('/', async (req, res) => {
    try {
        const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, slides });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

// GET all hero slides (admin)
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
    try {
        const slides = await HeroSlide.find().sort({ order: 1 });
        res.json({ success: true, slides });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch hero slides' });
    }
});

// CREATE hero slide (admin)
router.post('/', verifyToken, requireAdmin, (req, res) => {
    heroUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const { title, subtitle, ctaText, ctaLink, bgColor, order, isActive } = req.body;

            const slide = await HeroSlide.create({
                title,
                subtitle: subtitle || '',
                ctaText: ctaText || 'Shop Now',
                ctaLink: ctaLink || '/products',
                image: req.file ? `/uploads/images/${req.file.filename}` : '',
                bgColor: bgColor || '#f5f0eb',
                order: order || 0,
                isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true
            });

            res.status(201).json({ success: true, slide });
        } catch (error) {
            console.error('Create hero slide error:', error);
            res.status(500).json({ success: false, message: 'Failed to create hero slide' });
        }
    });
});

// UPDATE hero slide (admin)
router.put('/:id', verifyToken, requireAdmin, (req, res) => {
    heroUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const slide = await HeroSlide.findById(req.params.id);
            if (!slide) {
                return res.status(404).json({ success: false, message: 'Slide not found' });
            }

            const { title, subtitle, ctaText, ctaLink, bgColor, order, isActive } = req.body;

            if (title !== undefined) slide.title = title;
            if (subtitle !== undefined) slide.subtitle = subtitle;
            if (ctaText !== undefined) slide.ctaText = ctaText;
            if (ctaLink !== undefined) slide.ctaLink = ctaLink;
            if (bgColor !== undefined) slide.bgColor = bgColor;
            if (order !== undefined) slide.order = parseInt(order);
            if (isActive !== undefined) slide.isActive = isActive === 'true' || isActive === true;

            // Replace image if new one uploaded
            if (req.file) {
                // Delete old image
                if (slide.image) {
                    const oldPath = path.join(__dirname, '..', slide.image);
                    try { fs.unlinkSync(oldPath); } catch (e) { /* ok */ }
                }
                slide.image = `/uploads/images/${req.file.filename}`;
            }

            await slide.save();
            res.json({ success: true, slide });
        } catch (error) {
            console.error('Update hero slide error:', error);
            res.status(500).json({ success: false, message: 'Failed to update hero slide' });
        }
    });
});

// DELETE hero slide (admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const slide = await HeroSlide.findById(req.params.id);
        if (!slide) {
            return res.status(404).json({ success: false, message: 'Slide not found' });
        }

        // Delete image file
        if (slide.image) {
            const filePath = path.join(__dirname, '..', slide.image);
            try { fs.unlinkSync(filePath); } catch (e) { /* ok */ }
        }

        await HeroSlide.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Slide deleted' });
    } catch (error) {
        console.error('Delete hero slide error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete hero slide' });
    }
});

export default router;
