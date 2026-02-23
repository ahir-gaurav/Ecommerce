import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: ['gst_percentage', 'delivery_charge', 'low_stock_threshold']
    },
    value: {
        type: Number,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

const analyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['daily', 'monthly'],
        required: true
    },
    metrics: {
        totalRevenue: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        newUsers: { type: Number, default: 0 },
        productsSold: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 }
    },
    topProducts: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: mongoose.Schema.Types.ObjectId,
        salesCount: Number,
        revenue: Number
    }],
    slowProducts: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: mongoose.Schema.Types.ObjectId,
        salesCount: Number,
        daysInStock: Number
    }]
}, {
    timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ type: 1, date: -1 });

const Settings = mongoose.model('Settings', settingsSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

export { Settings, Analytics };
