const { expect } = require('chai');
const sinon = require('sinon');
const User = require('../models/User');
const { registerUser } = require('../controllers/authController');
const { validateRegistration } = require('../utils/validateRegistration');

// A complete, valid registration; each test changes one field.
const validBody = () => ({
    name: 'Qian Zhang',
    email: 'Qian@Example.com',
    password: 'StrongPass1',
    institution: 'Queensland University of Technology',
    degree: 'Master of IT',
    graduationYear: '2020',
    studentId: 'n1234567',
    verificationLink: 'https://www.linkedin.com/in/example',
    consent: true,
});

const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
};

describe('ALN-9 registration validation (R1)', () => {
    it('accepts a complete, valid registration', () => {
        expect(validateRegistration(validBody())).to.deep.equal({});
    });

    it('reports every missing required field', () => {
        const errors = validateRegistration({});
        expect(errors).to.have.all.keys(
            'name', 'email', 'password', 'institution', 'degree',
            'graduationYear', 'studentId', 'verificationLink', 'consent'
        );
    });

    it('rejects an invalid email address', () => {
        const errors = validateRegistration({ ...validBody(), email: 'not-an-email' });
        expect(errors).to.have.key('email');
    });

    it('rejects a password shorter than 8 characters', () => {
        const errors = validateRegistration({ ...validBody(), password: 'short' });
        expect(errors).to.have.key('password');
    });

    it('rejects a graduation year before 1950 or in the future', () => {
        const nextYear = new Date().getFullYear() + 1;
        expect(validateRegistration({ ...validBody(), graduationYear: '1949' })).to.have.key('graduationYear');
        expect(validateRegistration({ ...validBody(), graduationYear: String(nextYear) })).to.have.key('graduationYear');
    });

    it('rejects a verification link that is not a full http(s) URL', () => {
        const errors = validateRegistration({ ...validBody(), verificationLink: 'linkedin.com/in/example' });
        expect(errors).to.have.key('verificationLink');
    });

    it('rejects a registration without privacy consent', () => {
        const errors = validateRegistration({ ...validBody(), consent: false });
        expect(errors).to.have.key('consent');
    });
});

describe('ALN-9 registerUser controller', () => {
    before(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    it('creates a pending member and returns 201', async () => {
        sinon.stub(User, 'findOne').resolves(null);
        const createStub = sinon.stub(User, 'create').resolves({
            id: '1', name: 'Qian Zhang', email: 'qian@example.com', verificationStatus: 'pending',
        });
        const res = mockRes();

        await registerUser({ body: validBody() }, res);

        expect(res.status.calledWith(201)).to.equal(true);
        const saved = createStub.firstCall.args[0];
        expect(saved.email).to.equal('qian@example.com');
        expect(saved.graduationYear).to.equal(2020);
        expect(saved.consentAt).to.be.instanceOf(Date);
        expect(saved).to.not.have.property('role');
    });

    it('returns 400 with field errors and does not touch the database when input is invalid', async () => {
        const findStub = sinon.stub(User, 'findOne');
        const res = mockRes();

        await registerUser({ body: { ...validBody(), password: 'short' } }, res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(res.json.firstCall.args[0].errors).to.have.key('password');
        expect(findStub.called).to.equal(false);
    });

    it('returns 400 when the email is already registered', async () => {
        sinon.stub(User, 'findOne').resolves({ id: 'existing' });
        const createStub = sinon.stub(User, 'create');
        const res = mockRes();

        await registerUser({ body: validBody() }, res);

        expect(res.status.calledWith(400)).to.equal(true);
        expect(res.json.firstCall.args[0].errors).to.have.key('email');
        expect(createStub.called).to.equal(false);
    });

    it('ignores a role sent in the request body', async () => {
        sinon.stub(User, 'findOne').resolves(null);
        const createStub = sinon.stub(User, 'create').resolves({ id: '2', verificationStatus: 'pending' });
        const res = mockRes();

        await registerUser({ body: { ...validBody(), role: 'admin', verificationStatus: 'approved' } }, res);

        const saved = createStub.firstCall.args[0];
        expect(saved).to.not.have.property('role');
        expect(saved).to.not.have.property('verificationStatus');
    });
});
