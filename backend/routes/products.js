import express from 'express';
import Product from '../models/Product.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadImages, uploadModel, cloudinary } from '../middleware/upload.js';

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment views
        product.views += 1;
        await product.save();

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
});

// Create product (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const body = { ...req.body };

        // Ensure basePrice is a valid number
        if (body.basePrice !== undefined) {
            body.basePrice = parseFloat(body.basePrice);
            if (isNaN(body.basePrice)) {
                return res.status(400).json({ success: false, message: 'Base price must be a valid number' });
            }
        }

        const product = await Product.create(body);
        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error('Product create error:', error);
        // Return full validation error details
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: messages });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0] || 'field';
            return res.status(400).json({ success: false, message: `Duplicate value for ${field}. Please use a unique value.` });
        }
        res.status(500).json({ success: false, message: error.message || 'Failed to create product' });
    }
});

// Update product (admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update product' });
    }
});

// Delete product (admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
});

// Add variant (admin only)
router.post('/:id/variants', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Ensure priceAdjustment is a number
        const variantData = { ...req.body };
        if (variantData.priceAdjustment !== undefined) {
            variantData.priceAdjustment = parseFloat(variantData.priceAdjustment) || 0;
        }
        if (variantData.stock !== undefined) {
            variantData.stock = parseInt(variantData.stock) || 0;
        }

        product.variants.push(variantData);
        await product.save();

        const newVariant = product.variants[product.variants.length - 1];

        res.json({
            success: true,
            variant: newVariant,
            updatedProduct: product
        });
    } catch (error) {
        console.error('Add variant error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ success: false, message: messages });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0] || 'sku';
            const val = error.keyValue ? Object.values(error.keyValue)[0] : '';
            return res.status(400).json({
                success: false,
                message: `Duplicate value for ${field} (${val}). Please use a unique SKU.`,
                error: 'DuplicateKey'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add variant',
        });
    }
});

// Update variant (admin only)
router.put('/:id/variants/:variantId', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = product.variants.id(req.params.variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        Object.assign(variant, req.body);
        await product.save();

        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update variant' });
    }
});

// Upload product images (admin only)
router.post('/:id/images', verifyToken, requireAdmin, (req, res) => {
    uploadImages(req, res, async (err) => {
        if (err) {
            console.error('Product image upload middleware error:', err.message, err);
            return res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
        }

        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No images uploaded' });
            }

            const newImages = req.files.map((file, index) => ({
                url: file.path,           // Cloudinary secure URL
                publicId: file.filename,  // Cloudinary public_id for deletion
                alt: product.name,
                isPrimary: product.images.length === 0 && index === 0
            }));

            product.images.push(...newImages);
            await product.save();

            res.json({ success: true, product });
        } catch (error) {
            console.error('Image upload error:', error);
            res.status(500).json({ success: false, message: 'Failed to upload images' });
        }
    });
});

// Delete a product image (admin only)
router.delete('/:id/images/:imageId', verifyToken, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const image = product.images.id(req.params.imageId);
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Delete from Cloudinary (if publicId is stored)
        if (image.publicId) {
            try { await cloudinary.uploader.destroy(image.publicId); } catch (e) { /* ignore */ }
        }

        product.images.pull(req.params.imageId);
        await product.save();

        res.json({ success: true, product });
    } catch (error) {
        console.error('Image delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
});

export default router;
