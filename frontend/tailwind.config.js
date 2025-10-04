/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-card": "var(--color-bg-card)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        border: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
