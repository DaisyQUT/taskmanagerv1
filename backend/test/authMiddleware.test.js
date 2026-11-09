const { expect } = require('chai');
const sinon = require('sinon');
const { requireRole, requireApproved } = require('../middleware/authMiddleware');

// records the status code and JSON sent back.
const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe('ALN-8 access middleware', () => {
    describe('requireRole', () => {
        it('lets an admin through to an admin-only route', () => {
            const req = { user: { role: 'admin' } };
            const res = mockRes();
            const next = sinon.spy();

            requireRole('admin')(req, res, next);

            expect(next.calledOnce).to.equal(true);
            expect(res.status.called).to.equal(false);
        });

        it('returns 403 when a member calls an admin-only route', () => {
            const req = { user: { role: 'member' } };
            const res = mockRes();
            const next = sinon.spy();

            requireRole('admin')(req, res, next);

            expect(res.status.calledWith(403)).to.equal(true);
            expect(next.called).to.equal(false);
        });

        it('returns 401 when there is no logged-in user', () => {
            const req = {};
            const res = mockRes();
            const next = sinon.spy();

            requireRole('admin')(req, res, next);

            expect(res.status.calledWith(401)).to.equal(true);
            expect(next.called).to.equal(false);
        });
    });

    describe('requireApproved', () => {
        it('lets an approved member through', () => {
            const req = { user: { role: 'member', verificationStatus: 'approved' } };
            const res = mockRes();
            const next = sinon.spy();

            requireApproved(req, res, next);

            expect(next.calledOnce).to.equal(true);
        });

        it('returns 403 for a pending member', () => {
            const req = { user: { role: 'member', verificationStatus: 'pending' } };
            const res = mockRes();
            const next = sinon.spy();

            requireApproved(req, res, next);

            expect(res.status.calledWith(403)).to.equal(true);
            expect(next.called).to.equal(false);
        });

        it('returns 403 for a rejected member', () => {
            const req = { user: { role: 'member', verificationStatus: 'rejected' } };
            const res = mockRes();
            const next = sinon.spy();

            requireApproved(req, res, next);

            expect(res.status.calledWith(403)).to.equal(true);
        });

        it('always lets an admin through', () => {
            const req = { user: { role: 'admin', verificationStatus: 'pending' } };
            const res = mockRes();
            const next = sinon.spy();

            requireApproved(req, res, next);

            expect(next.calledOnce).to.equal(true);
        });
    });
});