const Post = require('../models/Post');
const { validatePost } = require('../utils/validatePost');
const { POST_TYPES } = require('../utils/postOptions');

const PAGE_SIZE = 10;

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

// ALN-25 (R9): open Requests or Offers, newest first, ten to a page.
const listPosts = async (req, res) => {
    const type = POST_TYPES.includes(req.query.type) ? req.query.type : 'request';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { type, status: 'open' };

    try {
        const total = await Post.countDocuments(filter);
        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .populate('author', 'name');

        res.json({
            page,
            totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
            posts: posts.map((post) => ({
                id: post.id,
                type: post.type,
                title: post.title,
                field: post.field,
                exchange: post.exchange,
                authorName: post.author?.name,
                createdAt: post.createdAt,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

// ALN-25 (R10): one post in full. Only the author's name is shared, never their email.
const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'name');
        if (!post) {
            return res.status(404).json({ message: 'We couldn\'t find that post.' });
        }

        res.json({
            id: post.id,
            type: post.type,
            title: post.title,
            description: post.description,
            field: post.field,
            exchange: post.exchange,
            status: post.status,
            authorName: post.author?.name,
            isOwner: String(post.author?._id) === String(req.user.id),
            createdAt: post.createdAt,
        });
    } catch (error) {
        // An id that isn't a valid database id is treated as "not found", not as a server error.
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'We couldn\'t find that post.' });
        }
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

module.exports = { createPost, listPosts, getPost, PAGE_SIZE };
