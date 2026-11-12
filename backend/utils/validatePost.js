const { POST_TYPES, FIELDS, EXCHANGES } = require('./postOptions');

// ALN-18 (R8): server-side validation for a new post, in the same shape as validateRegistration:
// field -> message, and an empty object means the input is valid.
const TITLE_MIN = 5;
const TITLE_MAX = 80;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 1000;

const length = (value) => (typeof value === 'string' ? value.trim().length : 0);

const validatePost = (body = {}) => {
    const errors = {};

    if (!POST_TYPES.includes(body.type)) {
        errors.type = 'Choose whether you need help or can help';
    }

    if (length(body.title) < TITLE_MIN || length(body.title) > TITLE_MAX) {
        errors.title = `Title must be ${TITLE_MIN} to ${TITLE_MAX} characters`;
    }

    if (length(body.description) < DESCRIPTION_MIN || length(body.description) > DESCRIPTION_MAX) {
        errors.description = `Description must be ${DESCRIPTION_MIN} to ${DESCRIPTION_MAX} characters`;
    }

    if (!FIELDS.includes(body.field)) {
        errors.field = 'Choose a field';
    }

    if (!EXCHANGES.includes(body.exchange)) {
        errors.exchange = 'Choose how you want to exchange';
    }

    return errors;
};

module.exports = { validatePost, TITLE_MIN, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX };
