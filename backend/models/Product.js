import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        // No enum — type may be extended by admin
    },
    size: {
        type: String,
        required: true,
        // No enum — size may be extended by admin
    },
    fragrance: {
        type: String,
        required: true,
        // No enum — fragrances are managed dynamically via the Fragrances admin page
    },
    priceAdjustment: {
        type: Number,
        default: 0,
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
        // NOTE: Do NOT use unique:true here — unique on subdocument array fields
        // creates a global sparse index that causes E11000 conflicts between different products.
        // SKU uniqueness is enforced at the application level in the pre-save hook below.
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
    brand: {
        type: String,
        default: 'Kicks Don\'t Stink'
    },
    sku: {
        type: String,
        unique: true,
        sparse: true // Allow products without a top-level SKU if variants are used
    },
    images: [{
        url: String,
        publicId: String,
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
    totalStock: {
        type: Number,
        default: 0
    },
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware to calculate total stock across all variants before saving
productSchema.pre('save', function (next) {
    if (this.variants && this.variants.length > 0) {
        this.totalStock = this.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    } else {
        // If no variants, totalStock might be manually set or default to 0
        // We only overwrite if there are variants present
    }
    next();
});

// Index for search and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });

// Boot-time cleanup: drop stale variant.sku unique index if it exists
productSchema.on('index', async function () {
    try {
        const Product = mongoose.model('Product');
        const indexes = await Product.collection.indexes();
        const staleSku = indexes.find(i => i.key?.['variants.sku'] && i.unique);
        if (staleSku) {
            await Product.collection.dropIndex(staleSku.name);
            console.log('🗑️ Dropped stale variants.sku unique index');
        }
    } catch (_) { /* index doesn't exist, nothing to do */ }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
