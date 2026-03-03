import mongoose from 'mongoose';

const tickerSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '✨'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Ticker = mongoose.model('Ticker', tickerSchema);
export default Ticker;
