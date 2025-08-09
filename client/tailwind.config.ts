import type { Config } from "tailwindcss";

const config: Config = {
  // These paths tell Tailwind CSS which files to scan for utility classes.
  // Tailwind will generate CSS only for the classes it finds in these files.
  content: [
    "./index.html",
    // This line is crucial for React projects, ensuring Tailwind scans all your JSX/TSX files.
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // The safelist ensures that specific utility classes are always included in the
  // generated CSS, even if Tailwind's scanner doesn't detect them (e.g., if
  // they're generated dynamically or conditionally).
  safelist: [
    "bg-primary",
    "text-primary",
    "font-sans",
  ],
  theme: {
    // The extend property allows you to add to Tailwind's default theme
    // without overwriting it entirely.
    extend: {
      // Custom color palette for your application.
      colors: {
        primary: "#3b82f6", // A vibrant blue for primary actions and highlights.
        secondary: "#6b7280", // A neutral gray for secondary elements.
        accent: "#8b5cf6", // A rich purple for accents.
        muted: "#f3f4f6", // A light gray for subtle backgrounds or borders.
        // Removed 'background' and 'foreground' custom colors here.
        // These were referencing undefined CSS variables ('--color-bg', '--color-text'),
        // which was likely causing the "no color" issue if those variables weren't
        // defined elsewhere. The application now uses direct Tailwind color classes.
      },
    },
  },
  // 'class' mode for dark mode, allowing you to toggle dark mode
  // by adding/removing a 'dark' class on your HTML element.
  darkMode: "class",
  // Plugins for additional Tailwind functionalities.
  plugins: [],
};

export default config;
