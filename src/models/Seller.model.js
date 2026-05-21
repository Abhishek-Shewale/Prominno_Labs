const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    mobileNo: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    skills: {
        type: [String],
        required: true,
        validate: [v => v.length > 0, 'At least one skill is required'],
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'seller',
    },
}, { timestamps: true });

module.exports = mongoose.model('Seller', sellerSchema);
