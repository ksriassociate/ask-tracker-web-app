// C:\Users\DELL\Desktop\Task\TaskTracker\TaskTracker\client\tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // Enables dark mode based on the presence of a 'dark' class on an ancestor element (e.g., <html>)
  darkMode: ["class"],

  // Crucial: This array tells Tailwind where to scan for your utility classes.
  // Paths are relative to the location of this tailwind.config.ts file.
  content: [
    "./index.html", // Scans your main HTML file (if it's in the same directory as this config)
    "./src/**/*.{js,jsx,ts,tsx}", // Scans files directly within the 'src' directory (e.g., App.tsx, main.tsx)
  ],

  theme: {
    extend: {
      // No custom borderRadius or colors are needed for the provided App.tsx code
      // If you plan to integrate Shadcn/ui fully later, you'll re-add these.
    },
  },
  // Ensure no old plugins like 'tailwindcss-animate' or '@tailwindcss/typography' are here
  plugins: [],
};