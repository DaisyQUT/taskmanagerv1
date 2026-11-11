// AlumniLink design tokens: one place for every colour and the typeface used in the app.
// ALN-27: white and deep purple theme. Status is shown with a symbol and a word, not a
// coloured box, so the palette stays small: brand purple, greys, and one colour for problems.
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3D1F4F', // primary actions, logo, current page, verified
          hover: '#2D163B',
        },
        ink: '#1B1421', // headings and body text
        muted: '#5F5468', // helper text, secondary labels, pending
        line: '#E5DEEA', // every border
        surface: '#FAF8FC', // page background
        danger: '#7A2E45', // errors and "not verified"
      },
      fontFamily: {
        // Manrope is bundled with the app (ALN-27), so no request goes to a font service.
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
