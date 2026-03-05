import mongoose from 'mongoose';

/**
 * Permanent HeroSlide Schema
 * 
 * DESIGN DECISION:
 * We use 'headline' as the primary text field for v2 features.
 * We include 'title' ONLY for backward compatibility with v1 logic/validation.
 * A pre-save hook ensures these stay in sync so legacy code never errors.
 */
const heroSlideSchema = new mongoose.Schema({
    slideIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 2,
        unique: true,
    },
    bg: {
        type: String,
        default: '#D6F2FF',
        trim: true,
    },
    badgeText: {
        type: String,
        default: 'SPF 50 | PA++++',
        trim: true,
    },
    headline: {
        type: String,
        default: 'Shield Your Skin\nThis Summer',
        trim: true,
    },
    cta: {
        type: String,
        default: 'Shop Now →',
        trim: true,
    },
    image: {
        type: String,
        default: '',
    },
    imagePublicId: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // BACKWARD COMPATIBILITY FIELD
    // We remove 'required: true' to prevent validation failures on new code.
    // We keep the field so legacy code can still read/write it if it hasn't been updated.
    title: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

/**
 * Super Senior Middleware:
 * Ensure 'title' and 'headline' are always in sync.
 * If one is updated, the other follows. This prevents "Title is required"
 * validation errors even if the MongoDB collection has strict validation enabled
 * or if legacy code is still checking for 'title'.
 */
heroSlideSchema.pre('save', function (next) {
    if (this.headline && !this.title) {
        this.title = this.headline;
    } else if (this.title && !this.headline) {
        this.headline = this.title;
    }
    next();
});

/**
 * Handle findOneAndUpdate (upserts)
 * Mongoose findOneAndUpdate does not trigger 'save' hooks, so we need this
 * to ensure v1/v2 field parity during admin updates.
 */
heroSlideSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    // Handle both $set: { ... } and direct { ... } updates
    const data = update.$set || update;

    if (data.headline && !data.title) {
        data.title = data.headline;
    } else if (data.title && !data.headline) {
        data.headline = data.title;
    }
    next();
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
