const mongoose = require('mongoose');
const { POST_TYPES, FIELDS, EXCHANGES } = require('../utils/postOptions');

// ALN-18 (R8): one model for both Requests and Offers, told apart by type (D6).
const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: POST_TYPES, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        field: { type: String, enum: FIELDS, required: true },
        exchange: { type: String, enum: EXCHANGES, required: true },
        status: { type: String, enum: ['open', 'closed'], default: 'open' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
