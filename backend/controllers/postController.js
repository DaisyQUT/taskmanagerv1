const Post = require('../models/Post');
const Response = require('../models/Response');
const { validatePost } = require('../utils/validatePost');
const { POST_TYPES } = require('../utils/postOptions');

const PAGE_SIZE = 10;
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 300;
const NOT_FOUND = "We couldn't find that post.";

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

// ALN-25 (R10): one post in full. Only the author's name is shared; the email only after acceptance (ALN-20).
const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'name email');
        if (!post) {
            return res.status(404).json({ message: NOT_FOUND });
        }

        // ALN-19: if the viewer has already responded, show them their response instead of the form.
        const myResponse = await Response.findOne({ post: post.id, responder: req.user.id });

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
            myResponse: myResponse
                ? {
                    message: myResponse.message,
                    status: myResponse.status,
                    createdAt: myResponse.createdAt,
                    // ALN-20: the author's email is shared only after they accept this member's response.
                    authorEmail: myResponse.status === 'accepted' ? post.author?.email : undefined,
                }
                : null,
        });
    } catch (error) {
        // An id that isn't a valid database id is treated as "not found", not as a server error.
        if (error.name === 'CastError') {
            return res.status(404).json({ message: NOT_FOUND });
        }
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

// ALN-19 (R11): an approved member responds to someone else's open post, once.
const respondToPost = async (req, res) => {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
        return res.status(400).json({
            message: 'Please correct the highlighted fields.',
            errors: { message: `Your message must be ${MESSAGE_MIN} to ${MESSAGE_MAX} characters` },
        });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: NOT_FOUND });
        }
        if (String(post.author) === String(req.user.id)) {
            return res.status(400).json({ message: "You can't respond to your own post." });
        }
        if (post.status !== 'open') {
            return res.status(409).json({ message: 'This post is closed.' });
        }

        const existing = await Response.findOne({ post: post.id, responder: req.user.id });
        if (existing) {
            return res.status(409).json({ message: "You've already responded to this post." });
        }

        const response = await Response.create({ post: post.id, responder: req.user.id, message });
        res.status(201).json({ id: response.id, status: response.status });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: NOT_FOUND });
        }
        // Two clicks at the same moment can pass the check above; the unique index stops the second.
        if (error.code === 11000) {
            return res.status(409).json({ message: "You've already responded to this post." });
        }
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

// ALN-20 (R12): the logged-in member's own posts, each with the responses it has received.
// A responder's email is included only once the author has accepted them.
const listMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.user.id }).sort({ createdAt: -1 });
        const responses = await Response.find({ post: { $in: posts.map((post) => post.id) } })
            .sort({ createdAt: 1 })
            .populate('responder', 'name email');

        res.json(
            posts.map((post) => ({
                id: post.id,
                type: post.type,
                title: post.title,
                status: post.status,
                createdAt: post.createdAt,
                responses: responses
                    .filter((response) => String(response.post) === String(post.id))
                    .map((response) => ({
                        id: response.id,
                        responderName: response.responder?.name,
                        message: response.message,
                        status: response.status,
                        createdAt: response.createdAt,
                        contactEmail: response.status === 'accepted' ? response.responder?.email : undefined,
                    })),
            }))
        );
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

module.exports = { createPost, listPosts, getPost, respondToPost, listMyPosts, PAGE_SIZE };
