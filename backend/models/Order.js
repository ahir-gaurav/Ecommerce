import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String,
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    variantDetails: {
        type: String,
        size: String,
        fragrance: String,
        sku: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    items: [orderItemSchema],
    pricing: {
        subtotal: { type: Number, required: true },
        gst: { type: Number, required: true },
        gstPercentage: { type: Number, required: true },
        deliveryCharge: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    shippingAddress: {
        fullName: String,
        phone: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        pincode: String
    },
    paymentInfo: {
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        method: String,
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending'
        }
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    estimatedDelivery: Date,
    deliveredAt: Date,
    invoiceUrl: String
}, {
    timestamps: true
});

// Generate order number
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `KDS${Date.now()}${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Indexes for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
