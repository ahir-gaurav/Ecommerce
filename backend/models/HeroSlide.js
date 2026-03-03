import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema({
    badgeText: {
        type: String,
        default: '🌿 100% Eco-Friendly Shoe Care',
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        default: 'Keep Your Kicks'
    },
    highlightText: {
        type: String,
        trim: true,
        default: 'Naturally Fresh'
    },
    description: {
        type: String,
        trim: true,
        default: 'Bamboo charcoal, cedar & lavender — zero chemicals, 100% biodegradable. Reusable for months.'
    },
    image: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

export default HeroSlide;
