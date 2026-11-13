const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const app = require('../server');
const { getOverview } = require('../controllers/postController');

chai.use(chaiHttp);
const { expect } = chai;

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// protect() loads the user with User.findById(id).select('-password').
const stubLoggedInUser = (user) =>
    sinon.stub(User, 'findById').returns({ select: sinon.stub().resolves(user) });

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

describe('ALN-21 anonymised overview for pending members (R3)', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('counts open Requests and Offers for every field, with no titles or names', async () => {
        const aggregateStub = sinon.stub(Post, 'aggregate').resolves([
            { _id: { field: 'Data & analytics', type: 'request' }, count: 3 },
            { _id: { field: 'Data & analytics', type: 'offer' }, count: 1 },
        ]);
        const res = mockRes();

        await getOverview({}, res);

        expect(aggregateStub.firstCall.args[0][0]).to.deep.equal({ $match: { status: 'open' } });
        const rows = res.json.firstCall.args[0];
        expect(rows).to.have.length(8);
        expect(rows[0]).to.deep.equal({ field: 'Data & analytics', requests: 3, offers: 1 });
        expect(rows[1]).to.deep.equal({ field: 'Software & IT', requests: 0, offers: 0 });
    });

    it('lets a pending member see the overview', async () => {
        stubLoggedInUser({ id: 'm1', role: 'member', verificationStatus: 'pending' });
        sinon.stub(Post, 'aggregate').resolves([]);

        const res = await chai.request(app)
            .get('/api/posts/overview')
            .set('Authorization', `Bearer ${tokenFor('m1')}`);

        expect(res).to.have.status(200);
    });

    it('still returns 403 when a pending member opens the boards themselves', async () => {
        stubLoggedInUser({ id: 'm1', role: 'member', verificationStatus: 'pending' });

        const res = await chai.request(app)
            .get('/api/posts')
            .set('Authorization', `Bearer ${tokenFor('m1')}`);

        expect(res).to.have.status(403);
    });

    it('returns 403 for an admin', async () => {
        stubLoggedInUser({ id: 'a1', role: 'admin', verificationStatus: 'approved' });

        const res = await chai.request(app)
            .get('/api/posts/overview')
            .set('Authorization', `Bearer ${tokenFor('a1')}`);

        expect(res).to.have.status(403);
    });
});
