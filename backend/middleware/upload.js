import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary config status on startup
console.log('☁️  Cloudinary config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ MISSING',
    api_key: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ MISSING'
});

// Export cloudinary instance for use in routes (e.g. delete)
export { cloudinary };

// Cloudinary storage for product images
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'kicks-dont-stink/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    }
});

// Upload middleware — stores directly to Cloudinary, no local disk
export const uploadImages = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 5);

// Cloudinary storage for hero images
const heroStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'kicks-dont-stink/hero',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1920, height: 800, crop: 'limit', quality: 'auto' }]
    }
});

// Hero upload middleware — stores directly to Cloudinary
export const uploadHero = multer({
    storage: heroStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('image');

// Keep model upload using memory storage (not used in production critical path)
export const uploadModel = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
}).single('model');
