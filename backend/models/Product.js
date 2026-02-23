import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Standard', 'Premium', 'Deluxe']
    },
    size: {
        type: String,
        required: true,
        enum: ['Small', 'Medium', 'Large']
    },
    fragrance: {
        type: String,
        required: true,
        enum: ['Lavender', 'Cedar', 'Unscented', 'Mixed']
    },
    priceAdjustment: {
        type: Number,
        default: 0,
        comment: 'Price difference from base price (can be negative for discounts)'
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    salesCount: {
        type: Number,
        default: 0
    },
    lastRestocked: Date
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        default: 'Kicks Don\'t Stink - Eco Shoe Deodoriser'
    },
    description: {
        type: String,
        required: true,
        default: 'A sustainable, biodegradable, reusable shoe deodoriser made from activated bamboo charcoal, cedar shavings, and lavender buds. Eliminates odor naturally without chemicals or plastic.'
    },
    category: {
        type: String,
        default: 'Eco-Friendly Home Care'
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    model3D: {
        type: String,
        comment: 'Path to 3D model file (GLB/GLTF format)'
    },
    ingredients: [{
        name: String,
        description: String
    }],
    features: [{
        type: String
    }],
    ecoImpact: {
        biodegradable: { type: Boolean, default: true },
        reusable: { type: Boolean, default: true },
        plasticFree: { type: Boolean, default: true },
        chemicalFree: { type: Boolean, default: true },
        compostable: { type: Boolean, default: true }
    },
    variants: [variantSchema],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate total stock across all variants
productSchema.virtual('totalStock').get(function () {
    return this.variants.reduce((sum, variant) => sum + variant.stock, 0);
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
