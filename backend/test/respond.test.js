const { expect } = require('chai');
const sinon = require('sinon');
const Post = require('../models/Post');
const Response = require('../models/Response');
const { respondToPost, getPost } = require('../controllers/postController');

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

const openPost = (overrides = {}) => ({ id: 'p1', author: 'author1', status: 'open', ...overrides });

const goodMessage = 'I moved from finance into data two years ago and can share what helped.';

const request = (body = { message: goodMessage }, userId = 'm2') => ({
    params: { id: 'p1' },
    user: { id: userId },
    body,
});

describe('ALN-19 respond to a post (R11)', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('saves a pending response and returns 201', async () => {
        sinon.stub(Post, 'findById').resolves(openPost());
        sinon.stub(Response, 'findOne').resolves(null);
        const createStub = sinon.stub(Response, 'create').resolves({ id: 'r1', status: 'pending' });
        const res = mockRes();

        await respondToPost(request(), res);

        expect(res.status.calledWith(201)).to.equal(true);
        expect(createStub.firstCall.args[0]).to.deep.equal({ post: 'p1', responder: 'm2', message: goodMessage });
    });

    it('returns 400 when the message is shorter than 20 characters', async () => {
        const findStub = sinon.stub(Post, 'findById');
        const res = mockRes();

        await respondToPost(request({ message: 'Happy to help' }), res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(res.json.firstCall.args[0].errors).to.have.key('message');
        expect(findStub.called).to.equal(false);
    });

    it('returns 400 when members respond to their own post', async () => {
        sinon.stub(Post, 'findById').resolves(openPost({ author: 'm2' }));
        const createStub = sinon.stub(Response, 'create');
        const res = mockRes();

        await respondToPost(request(), res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(createStub.called).to.equal(false);
    });

    it('returns 409 when the post is closed', async () => {
        sinon.stub(Post, 'findById').resolves(openPost({ status: 'closed' }));
        const res = mockRes();

        await respondToPost(request(), res);

        expect(res.status.calledWith(409)).to.equal(true);
    });

    it('returns 409 when the member has already responded', async () => {
        sinon.stub(Post, 'findById').resolves(openPost());
        sinon.stub(Response, 'findOne').resolves({ id: 'r0' });
        const createStub = sinon.stub(Response, 'create');
        const res = mockRes();

        await respondToPost(request(), res);

        expect(res.status.calledWith(409)).to.equal(true);
        expect(createStub.called).to.equal(false);
    });

    it('returns 404 when the post does not exist', async () => {
        sinon.stub(Post, 'findById').resolves(null);
        const res = mockRes();

        await respondToPost(request(), res);

        expect(res.status.calledWith(404)).to.equal(true);
    });

    it("shows members their own response when they open the post again", async () => {
        sinon.stub(Post, 'findById').returns({
            populate: sinon.stub().resolves({ id: 'p1', author: { _id: 'author1', name: 'Ann Lee' }, status: 'open' }),
        });
        sinon.stub(Response, 'findOne').resolves({ message: goodMessage, status: 'pending', createdAt: new Date() });
        const res = mockRes();

        await getPost({ params: { id: 'p1' }, user: { id: 'm2' } }, res);

        expect(res.json.firstCall.args[0].myResponse.status).to.equal('pending');
    });
});
