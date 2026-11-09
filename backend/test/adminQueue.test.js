const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const app = require('../server');
const { getPendingApplications, daysWaiting } = require('../controllers/adminController');

chai.use(chaiHttp);
const { expect } = chai;

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// Stands in for User.find().sort().select() and resolves to the given documents.
const stubFindChain = (documents) => {
    const query = {
        sort: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(documents),
    };
    const findStub = sinon.stub(User, 'find').returns(query);
    return { findStub, query };
};

describe('Verification queue', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('daysWaiting', () => {
        it('counts whole days since submission', () => {
            const now = new Date('2026-11-10T09:00:00Z');
            expect(daysWaiting(new Date('2026-11-07T08:00:00Z'), now)).to.equal(3);
        });

        it('returns 0 for an application submitted today', () => {
            const now = new Date('2026-11-10T09:00:00Z');
            expect(daysWaiting(new Date('2026-11-10T08:00:00Z'), now)).to.equal(0);
        });
    });

    describe('getPendingApplications controller', () => {
        it('asks only for pending members, oldest first', async () => {
            const { findStub, query } = stubFindChain([]);

            await getPendingApplications({}, mockRes());

            expect(findStub.firstCall.args[0]).to.deep.equal({ role: 'member', verificationStatus: 'pending' });
            expect(query.sort.firstCall.args[0]).to.deep.equal({ createdAt: 1 });
            expect(query.select.firstCall.args[0]).to.not.include('password');
        });

        it('returns each application with the days it has waited', async () => {
            const submitted = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            stubFindChain([{ id: 'a1', name: 'Ann Lee', email: 'ann@example.com', createdAt: submitted }]);
            const res = mockRes();

            await getPendingApplications({}, res);

            expect(res.status.calledWith(200)).to.equal(true);
            const [application] = res.json.firstCall.args[0];
            expect(application.name).to.equal('Ann Lee');
            expect(application.daysWaiting).to.equal(3);
        });

        it('returns an empty list when nobody is waiting', async () => {
            stubFindChain([]);
            const res = mockRes();

            await getPendingApplications({}, res);

            expect(res.json.firstCall.args[0]).to.deep.equal([]);
        });

        it('returns 500 when the database fails', async () => {
            sinon.stub(User, 'find').returns({
                sort: sinon.stub().returnsThis(),
                select: sinon.stub().rejects(new Error('database down')),
            });
            const res = mockRes();

            await getPendingApplications({}, res);

            expect(res.status.calledWith(500)).to.equal(true);
        });
    });

    describe('GET /api/admin/verifications access', () => {
        // protect() loads the user with User.findById(id).select('-password').
        const stubLoggedInUser = (user) =>
            sinon.stub(User, 'findById').returns({ select: sinon.stub().resolves(user) });

        it('returns 401 without a token', async () => {
            const res = await chai.request(app).get('/api/admin/verifications');
            expect(res).to.have.status(401);
        });

        it('returns 403 for a member', async () => {
            stubLoggedInUser({ id: 'm1', role: 'member', verificationStatus: 'approved' });
            const token = jwt.sign({ id: 'm1' }, process.env.JWT_SECRET);

            const res = await chai.request(app)
                .get('/api/admin/verifications')
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(403);
        });

        it('returns 200 for an admin', async () => {
            stubLoggedInUser({ id: 'a1', role: 'admin', verificationStatus: 'approved' });
            stubFindChain([]);
            const token = jwt.sign({ id: 'a1' }, process.env.JWT_SECRET);

            const res = await chai.request(app)
                .get('/api/admin/verifications')
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal([]);
        });
    });
});