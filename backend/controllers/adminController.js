const User = require('../models/User');

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

module.exports = { getPendingApplications, daysWaiting };