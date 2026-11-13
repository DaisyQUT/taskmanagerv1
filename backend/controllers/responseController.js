const Response = require('../models/Response');

// ALN-20 (R11, R12): the post's author accepts or declines a response, once.
// Accepting shares both emails: the author sees it in My posts, the responder on the post page.
const decideResponse = (decision) => async (req, res) => {
    try {
        const response = await Response.findById(req.params.id).populate('post').populate('responder', 'name email');
        if (!response) {
            return res.status(404).json({ message: "We couldn't find that response." });
        }
        if (String(response.post?.author) !== String(req.user.id)) {
            return res.status(403).json({ message: "Only the post's author can decide on its responses." });
        }
        if (response.status !== 'pending') {
            return res.status(409).json({ message: 'You have already decided on this response.' });
        }

        response.status = decision;
        await response.save();

        res.json({
            id: response.id,
            status: response.status,
            contactEmail: decision === 'accepted' ? response.responder?.email : undefined,
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: "We couldn't find that response." });
        }
        res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
    }
};

const acceptResponse = decideResponse('accepted');
const declineResponse = decideResponse('declined');

module.exports = { acceptResponse, declineResponse };
