const mongoose = require('mongoose');

// ALN-19 (R10): a member's reply to someone else's post. The author later accepts or declines it (ALN-20).
const responseSchema = new mongoose.Schema(
    {
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
        responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    },
    { timestamps: true }
);

// One response per member per post. The controller checks first; this index is the backstop.
responseSchema.index({ post: 1, responder: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);
