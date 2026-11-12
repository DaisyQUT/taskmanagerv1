const Post = require('../models/Post');
const { validatePost } = require('../utils/validatePost');

// ALN-18 (R8): an approved member publishes a Request or an Offer.
const createPost = async (req, res) => {
    const errors = validatePost(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });
    }

    try {
        // Only these fields come from the request; the author is always the logged-in member.
        const post = await Post.create({
            author: req.user.id,
            type: req.body.type,
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            field: req.body.field,
            exchange: req.body.exchange,
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

module.exports = { createPost };
