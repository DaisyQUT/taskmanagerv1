// ALN-18: the same lists as backend/utils/postOptions.js, with the words people see.
// A change here needs the same change there.
export const POST_TYPES = [
  { value: 'request', label: 'I need help', boardLabel: 'Request' },
  { value: 'offer', label: 'I can help', boardLabel: 'Offer' },
];

export const FIELDS = [
  'Data & analytics',
  'Software & IT',
  'Cyber security',
  'Public sector',
  'Business & finance',
  'Health',
  'Education',
  'Other',
];

export const EXCHANGES = [
  { value: 'free', label: 'Free help' },
  { value: 'swap', label: 'Skill swap' },
  { value: 'private', label: 'Arranged privately' },
];

export const labelFor = (options, value) => options.find((option) => option.value === value)?.label || value;

// Only approved members use the exchange board (ALN-8). Admins are not graduates in the network.
export const canUseBoards = (user) => user?.role === 'member' && user?.verificationStatus === 'approved';
