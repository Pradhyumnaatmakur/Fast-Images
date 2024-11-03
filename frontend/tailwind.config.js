// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          start: "#2E3192",
          end: "#1BFFFF",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #2E3192, #1BFFFF)",
      },
    },
  },
  plugins: [],
};
