const { expect } = require('chai');
const sinon = require('sinon');
const User = require('../models/User');
const { getProfile, updateUserProfile } = require('../controllers/authController');

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

// A member as stored in the database; each test changes what it needs.
const storedMember = (overrides = {}) => ({
    id: 'm1',
    name: 'Ann Lee',
    email: 'ann@example.com',
    institution: 'QUT',
    degree: 'Master of IT',
    graduationYear: 2024,
    verificationStatus: 'pending',
    ...overrides,
});

describe('ALN-26 profile shows application status (R3)', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('returns the status and graduation details', async () => {
        sinon.stub(User, 'findById').resolves(storedMember());
        const res = mockRes();

        await getProfile({ user: { id: 'm1' } }, res);

        const body = res.json.firstCall.args[0];
        expect(body.verificationStatus).to.equal('pending');
        expect(body.degree).to.equal('Master of IT');
        expect(body.graduationYear).to.equal(2024);
    });

    it("includes the admin's reason when an application was rejected", async () => {
        sinon.stub(User, 'findById').resolves(
            storedMember({ verificationStatus: 'rejected', rejectionReason: 'The link does not show a degree.' })
        );
        const res = mockRes();

        await getProfile({ user: { id: 'm1' } }, res);

        expect(res.json.firstCall.args[0].rejectionReason).to.equal('The link does not show a degree.');
    });

    it('does not let a member change their graduation details', async () => {
        const member = storedMember();
        member.save = sinon.stub().resolves(member);
        sinon.stub(User, 'findById').resolves(member);
        const res = mockRes();

        await updateUserProfile(
            { user: { id: 'm1' }, body: { name: 'Ann Lee', institution: 'Another University' } },
            res
        );

        expect(member.institution).to.equal('QUT');
        expect(member.save.calledOnce).to.equal(true);
    });

    it('returns 400 when the new email belongs to someone else', async () => {
        const member = storedMember();
        member.save = sinon.stub();
        sinon.stub(User, 'findById').resolves(member);
        sinon.stub(User, 'findOne').resolves({ id: 'someone-else' });
        const res = mockRes();

        await updateUserProfile({ user: { id: 'm1' }, body: { email: 'Taken@Example.com' } }, res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(member.save.called).to.equal(false);
    });
});
