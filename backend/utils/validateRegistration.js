// ALN-9 (R1): server-side validation for the registration form.
// Returns an object of field -> message, an empty object means the input is valid.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_PATTERN = /^[A-Za-z0-9-]{3,20}$/;
const MIN_GRADUATION_YEAR = 1950;
const MIN_PASSWORD_LENGTH = 8;

const isBlank = (value) => typeof value !== 'string' || value.trim() === '';

const isValidUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
};

const validateRegistration = (body = {}) => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (isBlank(body.name)) {
        errors.name = 'Name is required';
    }

    if (isBlank(body.email)) {
        errors.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(body.email.trim())) {
        errors.email = 'Enter a valid email address';
    }

    if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }

    if (isBlank(body.institution)) {
        errors.institution = 'Institution is required';
    }

    if (isBlank(body.degree)) {
        errors.degree = 'Degree is required';
    }

    const year = Number(body.graduationYear);
    if (!Number.isInteger(year) || year < MIN_GRADUATION_YEAR || year > currentYear) {
        errors.graduationYear = `Graduation year must be between ${MIN_GRADUATION_YEAR} and ${currentYear}`;
    }

    if (isBlank(body.studentId)) {
        errors.studentId = 'Student ID is required';
    } else if (!STUDENT_ID_PATTERN.test(body.studentId.trim())) {
        errors.studentId = 'Student ID must be 3 to 20 letters, numbers or hyphens';
    }

    if (isBlank(body.verificationLink)) {
        errors.verificationLink = 'A verification link is required';
    } else if (!isValidUrl(body.verificationLink.trim())) {
        errors.verificationLink = 'Enter a full link starting with http:// or https://';
    }

    if (body.consent !== true) {
        errors.consent = 'You must accept the privacy notice to register';
    }

    return errors;
};

module.exports = { validateRegistration, MIN_GRADUATION_YEAR, MIN_PASSWORD_LENGTH };