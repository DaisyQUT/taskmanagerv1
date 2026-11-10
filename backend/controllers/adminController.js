const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Everything an admin needs to decide on an application. The password is never read.
const APPLICATION_FIELDS = 'name email institution degree graduationYear studentId verificationLink createdAt';

const daysWaiting = (submittedAt, now = new Date()) =>
    Math.max(0, Math.floor((now - new Date(submittedAt)) / MS_PER_DAY));

const getPendingApplications = async (req, res) => {
    try {
        const applications = await User.find({ role: 'member', verificationStatus: 'pending' })
            .sort({ createdAt: 1 })
            .select(APPLICATION_FIELDS);

        const now = new Date();
        res.status(200).json(
            applications.map((application) => ({
                id: application.id,
                name: application.name,
                email: application.email,
                institution: application.institution,
                degree: application.degree,
                graduationYear: application.graduationYear,
                studentId: application.studentId,
                verificationLink: application.verificationLink,
                submittedAt: application.createdAt,
                daysWaiting: daysWaiting(application.createdAt, now),
            }))
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const MIN_REASON_LENGTH = 10;

const handleDecisionError = (error, res) => {
    // An id that isn't a valid database id can't match any application.
    if (error.name === 'CastError') {
        return res.status(404).json({ message: 'Application not found' });
    }
    console.error('Verification decision failed:', error);
    return res.status(500).json({ message: 'Something went wrong. Try again in a moment.' });
};

const approveApplication = async (req, res) => {
    try {
        const member = await User.findById(req.params.id);
        if (!member || member.role !== 'member') {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (member.verificationStatus !== 'pending') {
            return res.status(409).json({ message: 'This application has already been decided.' });
        }

        member.verificationStatus = 'approved';
        member.rejectionReason = undefined;
        member.decidedAt = new Date();
        await member.save();

        await AuditLog.create({ admin: req.user._id, member: member._id, decision: 'approved' });

        res.status(200).json({ id: member.id, verificationStatus: member.verificationStatus });
    } catch (error) {
        handleDecisionError(error, res);
    }
};

const rejectApplication = async (req, res) => {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < MIN_REASON_LENGTH) {
        return res.status(400).json({
            message: 'Please correct the highlighted fields.',
            errors: { reason: `Write at least ${MIN_REASON_LENGTH} characters so the member knows what to fix` },
        });
    }

    try {
        const member = await User.findById(req.params.id);
        if (!member || member.role !== 'member') {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (member.verificationStatus !== 'pending') {
            return res.status(409).json({ message: 'This application has already been decided.' });
        }

        member.verificationStatus = 'rejected';
        member.rejectionReason = reason;
        member.decidedAt = new Date();
        await member.save();

        await AuditLog.create({ admin: req.user._id, member: member._id, decision: 'rejected', reason });

        res.status(200).json({ id: member.id, verificationStatus: member.verificationStatus });
    } catch (error) {
        handleDecisionError(error, res);
    }
};

module.exports = { getPendingApplications, daysWaiting, approveApplication, rejectApplication };