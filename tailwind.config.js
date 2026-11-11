/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./code.html', './produits.html', './src/**/*.html', './assets/*.js'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
