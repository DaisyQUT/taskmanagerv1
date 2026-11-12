const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const app = require('../server');
const { createPost } = require('../controllers/postController');
const { validatePost } = require('../utils/validatePost');

chai.use(chaiHttp);
const { expect } = chai;

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// A complete, valid post; each test changes one field.
const validPost = () => ({
    type: 'request',
    title: 'Advice on moving into data',
    description: 'I work in admin and want to move into a data analyst role.',
    field: 'Data & analytics',
    exchange: 'free',
});

// protect() loads the user with User.findById(id).select('-password').
const stubLoggedInUser = (user) =>
    sinon.stub(User, 'findById').returns({ select: sinon.stub().resolves(user) });

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

describe('ALN-18 publish a post (R8)', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('validatePost', () => {
        it('accepts a complete, valid post', () => {
            expect(validatePost(validPost())).to.deep.equal({});
        });

        it('rejects a title shorter than 5 characters', () => {
            expect(validatePost({ ...validPost(), title: 'Help' })).to.have.key('title');
        });

        it('rejects a field that is not on the list', () => {
            expect(validatePost({ ...validPost(), field: 'Astrology' })).to.have.key('field');
        });

        it('reports every missing field', () => {
            expect(validatePost({})).to.have.keys('type', 'title', 'description', 'field', 'exchange');
        });
    });

    describe('createPost controller', () => {
        it('saves the post with the logged-in member as author and returns 201', async () => {
            const createStub = sinon.stub(Post, 'create').resolves({ id: 'p1' });
            const res = mockRes();

            await createPost({ user: { id: 'm1' }, body: { ...validPost(), author: 'someone-else', status: 'closed' } }, res);

            expect(res.status.calledWith(201)).to.equal(true);
            const saved = createStub.firstCall.args[0];
            expect(saved.author).to.equal('m1');
            expect(saved).to.not.have.property('status');
        });

        it('returns 400 and saves nothing when the input is invalid', async () => {
            const createStub = sinon.stub(Post, 'create');
            const res = mockRes();

            await createPost({ user: { id: 'm1' }, body: { ...validPost(), description: 'Too short' } }, res);

            expect(res.status.calledWith(400)).to.equal(true);
            expect(createStub.called).to.equal(false);
        });
    });

    describe('POST /api/posts access', () => {
        it('returns 403 for a pending member', async () => {
            stubLoggedInUser({ id: 'm1', role: 'member', verificationStatus: 'pending' });

            const res = await chai.request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${tokenFor('m1')}`)
                .send(validPost());

            expect(res).to.have.status(403);
        });

        it('returns 403 for an admin', async () => {
            stubLoggedInUser({ id: 'a1', role: 'admin', verificationStatus: 'approved' });

            const res = await chai.request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${tokenFor('a1')}`)
                .send(validPost());

            expect(res).to.have.status(403);
        });

        it('returns 201 for an approved member', async () => {
            stubLoggedInUser({ id: 'm1', role: 'member', verificationStatus: 'approved' });
            sinon.stub(Post, 'create').resolves({ id: 'p1' });

            const res = await chai.request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${tokenFor('m1')}`)
                .send(validPost());

            expect(res).to.have.status(201);
        });
    });
});
