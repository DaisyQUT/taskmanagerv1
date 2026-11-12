const { expect } = require('chai');
const sinon = require('sinon');
const Post = require('../models/Post');
const Response = require('../models/Response');
const { acceptResponse, declineResponse } = require('../controllers/responseController');
const { listMyPosts, getPost } = require('../controllers/postController');

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// findById(...).populate('post').populate('responder', ...) resolves to the response.
const stubFindResponse = (response) => {
    const second = { populate: sinon.stub().resolves(response) };
    return sinon.stub(Response, 'findById').returns({ populate: sinon.stub().returns(second) });
};

const pendingResponse = (overrides = {}) => ({
    id: 'r1',
    status: 'pending',
    post: { author: 'author1' },
    responder: { name: 'Lily S', email: 'lily@example.com' },
    save: sinon.stub().resolvesThis(),
    ...overrides,
});

const request = (userId = 'author1') => ({ params: { id: 'r1' }, user: { id: userId } });

describe('ALN-20 accept or decline responses (R12)', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('acceptResponse and declineResponse', () => {
        it("accepts a pending response and returns the responder's email", async () => {
            const response = pendingResponse();
            stubFindResponse(response);
            const res = mockRes();

            await acceptResponse(request(), res);

            expect(response.status).to.equal('accepted');
            expect(response.save.calledOnce).to.equal(true);
            expect(res.json.firstCall.args[0].contactEmail).to.equal('lily@example.com');
        });

        it('declines a pending response without sharing an email', async () => {
            const response = pendingResponse();
            stubFindResponse(response);
            const res = mockRes();

            await declineResponse(request(), res);

            expect(response.status).to.equal('declined');
            expect(res.json.firstCall.args[0].contactEmail).to.equal(undefined);
        });

        it("returns 403 when someone other than the post's author decides", async () => {
            const response = pendingResponse();
            stubFindResponse(response);
            const res = mockRes();

            await acceptResponse(request('someone-else'), res);

            expect(res.status.calledWith(403)).to.equal(true);
            expect(response.save.called).to.equal(false);
        });

        it('returns 409 when the response was already decided', async () => {
            const response = pendingResponse({ status: 'declined' });
            stubFindResponse(response);
            const res = mockRes();

            await acceptResponse(request(), res);

            expect(res.status.calledWith(409)).to.equal(true);
            expect(response.save.called).to.equal(false);
        });

        it('returns 404 when the response does not exist', async () => {
            stubFindResponse(null);
            const res = mockRes();

            await declineResponse(request(), res);

            expect(res.status.calledWith(404)).to.equal(true);
        });
    });

    describe('contact details are shared only after acceptance', () => {
        it('My posts shows the email of accepted responders only', async () => {
            sinon.stub(Post, 'find').returns({ sort: sinon.stub().resolves([{ id: 'p1', title: 'CV review' }]) });
            sinon.stub(Response, 'find').returns({
                sort: sinon.stub().returnsThis(),
                populate: sinon.stub().resolves([
                    { id: 'r1', post: 'p1', status: 'accepted', responder: { name: 'Lily S', email: 'lily@example.com' } },
                    { id: 'r2', post: 'p1', status: 'pending', responder: { name: 'Ben Wu', email: 'ben@example.com' } },
                ]),
            });
            const res = mockRes();

            await listMyPosts({ user: { id: 'author1' } }, res);

            const [responseA, responseB] = res.json.firstCall.args[0][0].responses;
            expect(responseA.contactEmail).to.equal('lily@example.com');
            expect(responseB.contactEmail).to.equal(undefined);
        });

        it("the responder sees the author's email once accepted", async () => {
            sinon.stub(Post, 'findById').returns({
                populate: sinon.stub().resolves({ id: 'p1', author: { _id: 'author1', name: 'Ann Lee', email: 'ann@example.com' }, status: 'open' }),
            });
            sinon.stub(Response, 'findOne').resolves({ message: 'Happy to help with your CV.', status: 'accepted', createdAt: new Date() });
            const res = mockRes();

            await getPost({ params: { id: 'p1' }, user: { id: 'm2' } }, res);

            expect(res.json.firstCall.args[0].myResponse.authorEmail).to.equal('ann@example.com');
        });

        it("the responder does not see the author's email while pending", async () => {
            sinon.stub(Post, 'findById').returns({
                populate: sinon.stub().resolves({ id: 'p1', author: { _id: 'author1', name: 'Ann Lee', email: 'ann@example.com' }, status: 'open' }),
            });
            sinon.stub(Response, 'findOne').resolves({ message: 'Happy to help with your CV.', status: 'pending', createdAt: new Date() });
            const res = mockRes();

            await getPost({ params: { id: 'p1' }, user: { id: 'm2' } }, res);

            expect(res.json.firstCall.args[0].myResponse.authorEmail).to.equal(undefined);
            expect(JSON.stringify(res.json.firstCall.args[0])).to.not.include('ann@example.com');
        });
    });
});
