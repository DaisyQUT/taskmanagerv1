// ALN-18: the choices a post can have. The frontend keeps the same lists in src/postOptions.js,
// so a change here needs the same change there.
const POST_TYPES = ['request', 'offer'];

const FIELDS = [
    'Data & analytics',
    'Software & IT',
    'Cyber security',
    'Public sector',
    'Business & finance',
    'Health',
    'Education',
    'Other',
];

// free = Free help, swap = Skill swap, private = Arranged privately (D6).
const EXCHANGES = ['free', 'swap', 'private'];

module.exports = { POST_TYPES, FIELDS, EXCHANGES };
