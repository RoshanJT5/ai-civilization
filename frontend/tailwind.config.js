/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'hsl(224, 71%, 4%)',
        'surface': 'hsla(224, 71%, 8%, 0.6)',
        'primary-glow': 'hsl(250, 95%, 70%)',
        'secondary': 'hsl(190, 90%, 50%)',
        'warning': 'hsl(15, 95%, 60%)',
        'success': 'hsl(145, 80%, 50%)',
        'muted': 'hsl(220, 20%, 60%)',
      },
      fontFamily: {
        'display': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
