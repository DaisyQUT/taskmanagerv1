const { expect } = require('chai');
const sinon = require('sinon');
const Post = require('../models/Post');
const { listPosts, getPost } = require('../controllers/postController');

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// Post.find() is chained: .sort().skip().limit().populate(). Each step returns the chain,
// and populate() returns the posts. The stubs let a test check what was asked for.
const stubFindChain = (posts) => {
    const chain = {
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        populate: sinon.stub().resolves(posts),
    };
    const findStub = sinon.stub(Post, 'find').returns(chain);
    return { findStub, chain };
};

const storedPost = (overrides = {}) => ({
    id: 'p1',
    type: 'request',
    title: 'Advice on moving into data',
    description: 'I work in admin and want to move into a data analyst role.',
    field: 'Data & analytics',
    exchange: 'free',
    status: 'open',
    author: { _id: 'm1', name: 'Ann Lee' },
    createdAt: new Date('2026-11-10'),
    ...overrides,
});

describe('ALN-25 browse posts (R9, R10)', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('listPosts', () => {
        it('returns open posts of the chosen type, newest first', async () => {
            sinon.stub(Post, 'countDocuments').resolves(1);
            const { findStub, chain } = stubFindChain([storedPost({ type: 'offer' })]);
            const res = mockRes();

            await listPosts({ query: { type: 'offer' } }, res);

            expect(findStub.firstCall.args[0]).to.deep.equal({ type: 'offer', status: 'open' });
            expect(chain.sort.firstCall.args[0]).to.deep.equal({ createdAt: -1 });
            const body = res.json.firstCall.args[0];
            expect(body.posts[0].authorName).to.equal('Ann Lee');
            expect(body.posts[0]).to.not.have.property('description');
        });

        it('skips earlier pages and reports the number of pages', async () => {
            sinon.stub(Post, 'countDocuments').resolves(25);
            const { chain } = stubFindChain([]);
            const res = mockRes();

            await listPosts({ query: { type: 'request', page: '3' } }, res);

            expect(chain.skip.firstCall.args[0]).to.equal(20);
            expect(res.json.firstCall.args[0].totalPages).to.equal(3);
        });

        it('falls back to Requests and page 1 for values it does not know', async () => {
            sinon.stub(Post, 'countDocuments').resolves(0);
            const { findStub, chain } = stubFindChain([]);
            const res = mockRes();

            await listPosts({ query: { type: 'everything', page: '-4' } }, res);

            expect(findStub.firstCall.args[0].type).to.equal('request');
            expect(chain.skip.firstCall.args[0]).to.equal(0);
        });
    });

    describe('getPost', () => {
        const stubFindById = (result) =>
            sinon.stub(Post, 'findById').returns({ populate: sinon.stub().resolves(result) });

        it('returns the full post and marks whether the viewer wrote it', async () => {
            stubFindById(storedPost());
            const res = mockRes();

            await getPost({ params: { id: 'p1' }, user: { id: 'm1' } }, res);

            const body = res.json.firstCall.args[0];
            expect(body.description).to.include('data analyst');
            expect(body.isOwner).to.equal(true);
            expect(body).to.not.have.property('authorEmail');
        });

        it('returns 404 when the post does not exist', async () => {
            stubFindById(null);
            const res = mockRes();

            await getPost({ params: { id: 'missing' }, user: { id: 'm2' } }, res);

            expect(res.status.calledWith(404)).to.equal(true);
        });

        it('returns 404 for an id that is not a valid database id', async () => {
            sinon.stub(Post, 'findById').returns({
                populate: sinon.stub().rejects(Object.assign(new Error('bad id'), { name: 'CastError' })),
            });
            const res = mockRes();

            await getPost({ params: { id: 'not-an-id' }, user: { id: 'm2' } }, res);

            expect(res.status.calledWith(404)).to.equal(true);
        });
    });
});
