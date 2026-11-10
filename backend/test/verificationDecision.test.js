const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const app = require('../server');
const { approveApplication, rejectApplication } = require('../controllers/adminController');

chai.use(chaiHttp);
const { expect } = chai;

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// A pending member as findById would return it, save() is a stub so nothing is written.
const pendingMember = () => ({
    _id: 'member1',
    id: 'member1',
    role: 'member',
    verificationStatus: 'pending',
    save: sinon.stub().resolvesThis(),
});

const adminRequest = (body = {}) => ({
    params: { id: 'member1' },
    body,
    user: { _id: 'admin1', role: 'admin' },
});

describe('Approve and reject applications', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('approves a pending member and writes an audit entry', async () => {
        const member = pendingMember();
        sinon.stub(User, 'findById').resolves(member);
        const auditStub = sinon.stub(AuditLog, 'create').resolves({});
        const res = mockRes();

        await approveApplication(adminRequest(), res);

        expect(res.status.calledWith(200)).to.equal(true);
        expect(member.verificationStatus).to.equal('approved');
        expect(member.save.calledOnce).to.equal(true);
        expect(auditStub.firstCall.args[0]).to.include({ admin: 'admin1', decision: 'approved' });
    });

    it('rejects a pending member with a reason and records it', async () => {
        const member = pendingMember();
        sinon.stub(User, 'findById').resolves(member);
        const auditStub = sinon.stub(AuditLog, 'create').resolves({});
        const res = mockRes();

        await rejectApplication(adminRequest({ reason: 'The link shows a different degree.' }), res);

        expect(res.status.calledWith(200)).to.equal(true);
        expect(member.verificationStatus).to.equal('rejected');
        expect(member.rejectionReason).to.equal('The link shows a different degree.');
        expect(auditStub.firstCall.args[0]).to.include({ decision: 'rejected' });
    });

    it('returns 400 and changes nothing when the reason is too short', async () => {
        const findStub = sinon.stub(User, 'findById');
        const res = mockRes();

        await rejectApplication(adminRequest({ reason: 'No.' }), res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(res.json.firstCall.args[0].errors).to.have.key('reason');
        expect(findStub.called).to.equal(false);
    });

    it('returns 409 when the application was already decided', async () => {
        sinon.stub(User, 'findById').resolves({ ...pendingMember(), verificationStatus: 'approved' });
        const auditStub = sinon.stub(AuditLog, 'create');
        const res = mockRes();

        await approveApplication(adminRequest(), res);

        expect(res.status.calledWith(409)).to.equal(true);
        expect(auditStub.called).to.equal(false);
    });

    it('returns 404 when the application does not exist', async () => {
        sinon.stub(User, 'findById').resolves(null);
        const res = mockRes();

        await approveApplication(adminRequest(), res);

        expect(res.status.calledWith(404)).to.equal(true);
    });

    it('returns 404 for an id that is not a valid database id', async () => {
        const castError = new Error('Cast to ObjectId failed');
        castError.name = 'CastError';
        sinon.stub(User, 'findById').rejects(castError);
        const res = mockRes();

        await approveApplication(adminRequest(), res);

        expect(res.status.calledWith(404)).to.equal(true);
    });

    it('returns 403 when a member tries to approve an application', async () => {
        sinon.stub(User, 'findById').returns({
            select: sinon.stub().resolves({ _id: 'm1', role: 'member', verificationStatus: 'approved' }),
        });
        const token = jwt.sign({ id: 'm1' }, process.env.JWT_SECRET);

        const res = await chai.request(app)
            .patch('/api/admin/verifications/member1/approve')
            .set('Authorization', `Bearer ${token}`);

        expect(res).to.have.status(403);
    });
});