import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema({
    slideIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 2,
        unique: true,  // one document per slide
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
    title: {             // Backward compatibility shim
        type: String,
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
}, {
    timestamps: true,
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
