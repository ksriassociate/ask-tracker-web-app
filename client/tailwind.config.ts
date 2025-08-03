import type { Config } from "tailwindcss";

const config = {
  // Enables dark mode based on the presence of a 'dark' class on an ancestor element (e.g., <html>)
  darkMode: ["class"],

  // Crucial: This array tells Tailwind where to scan for your utility classes.
  // Paths are relative to the location of this tailwind.config.ts file.
  content: [
    "./index.html", // Scans your main HTML file (if it's in the same directory as this config)
    "./src/**/*.{js,jsx,ts,tsx}", // Scans files directly within the 'src' directory (e.g., App.tsx, main.tsx)
    "./src/components/**/*.{js,jsx,ts,tsx}", // Scans all files within 'src/components' and its subdirectories (e.g., layout, modals, ui, CustomerForm.tsx, EmployeeForm.tsx, TaskForm.tsx)
  ],

  theme: {
    // Allows you to extend Tailwind's default theme with your custom values
    extend: {
      // Custom border radius values, likely tied to CSS variables for consistent theming (e.g., Shadcn UI)
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom color palette, also typically defined via CSS variables for dynamic theming
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      // Custom keyframes for animations
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      // Custom animation utilities using the defined keyframes
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // Remove this plugins section
  // plugins: [
  //   require("tailwindcss-animate"),
  //   require("@tailwindcss/typography"),
  // ],
} satisfies Config;

export default config;