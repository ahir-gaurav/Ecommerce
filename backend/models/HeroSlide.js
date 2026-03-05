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
    order: {
        type: Number,
        default: 0,
    },
    bg: {
        type: String,
        default: '#D6F2FF',
        trim: true,
    },
    // ALIAS FOR BACKWARD COMPATIBILITY
    bgColor: {
        type: String,
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
        required: false,
        default: '',
    },
}, {
    timestamps: true,
});

/**
 * Super Senior Middleware:
 * Ensure 'title' <-> 'headline' and 'bg' <-> 'bgColor' are always in sync.
 */
heroSlideSchema.pre('save', function (next) {
    // Always keep headline and title in sync
    if (this.headline !== undefined) {
        this.title = this.headline;
    } else if (this.title !== undefined) {
        this.headline = this.title;
    }

    // Always keep bg and bgColor in sync
    if (this.bg !== undefined) {
        this.bgColor = this.bg;
    } else if (this.bgColor !== undefined) {
        this.bg = this.bgColor;
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
    const data = update.$set || update;

    // Always keep headline and title in sync
    if (data.headline !== undefined) {
        data.title = data.headline;
    } else if (data.title !== undefined) {
        data.headline = data.title;
    }

    // Always keep bg and bgColor in sync
    if (data.bg !== undefined) {
        data.bgColor = data.bg;
    } else if (data.bgColor !== undefined) {
        data.bg = data.bgColor;
    }
    next();
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
