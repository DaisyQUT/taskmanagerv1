// AlumniLink design tokens: one place for every colour used in the app.

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D3557', // primary actions
          hover: '#16293F',
          soft: '#E8EDF4', // selected or highlighted backgrounds
        },
        ink: '#101828', // headings and body text
        muted: '#475467', // helper text, secondary labels
        line: '#D0D5DD', // input and card borders
        surface: '#F9FAFB', // page background
        danger: {
          DEFAULT: '#B42318', // error 
          bg: '#FEF3F2',
          border: '#FDA29B',
        },
        success: {
          DEFAULT: '#067647', // success
          bg: '#ECFDF3',
          border: '#ABEFC6',
        },
      },
    },
  },
  plugins: [],
};