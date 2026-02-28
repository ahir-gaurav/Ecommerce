import mongoose from 'mongoose';

const fragranceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Fragrance = mongoose.model('Fragrance', fragranceSchema);
export default Fragrance;
