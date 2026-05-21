const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: true,
        trim: true,
    },
    detail: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    brands: {
        type: [brandSchema],
        required: true,
        validate: [v => v.length > 0, 'At least one brand is required'],
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
