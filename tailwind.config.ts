import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./client/index.html", 
    "./client/src/**/*.{js,jsx,ts,tsx}"
  ],
  // Enable JIT mode for faster builds
  mode: "jit",
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      screens: {
        // Use Tailwind's default breakpoints (md: 768px, lg: 1024px)
      },
      fontFamily: {
        sans: ['Lora', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        'dark-navy': '#1A1D2B',
        'navy': '#2C3147',
        'bright-blue': '#4A80FF',
        'custom-dark': '#202434',
      },
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
        "spin-y-slow": {
          from: { transform: "rotateY(0deg)" },
          to: { transform: "rotateY(360deg)" },
        },
        glow: {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(254, 226, 82, 0.7))" },
          "50%": { filter: "drop-shadow(0 0 16px rgba(254, 226, 82, 1))" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "shake-and-glow": {
          "0%, 100%": {
            transform: "translateX(0)",
            filter: "drop-shadow(0 0 8px rgba(254, 226, 82, 0.7))",
          },
          "10%": { transform: "translateX(-2px)" },
          "20%": { transform: "translateX(2px)" },
          "30%": { transform: "translateX(-2px)" },
          "40%": { transform: "translateX(2px)" },
          "50%": {
            transform: "translateX(-2px)",
            filter: "drop-shadow(0 0 16px rgba(254, 226, 82, 1))",
          },
          "60%": { transform: "translateX(2px)" },
          "70%": { transform: "translateX(-2px)" },
          "80%": { transform: "translateX(2px)" },
          "90%": { transform: "translateX(-2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-y-slow": "spin-y-slow 5s linear infinite",
        glow: "glow 2.5s ease-in-out infinite",
        shake: "shake 1.5s ease-in-out infinite",
        "shake-and-glow": "shake-and-glow 1.5s ease-in-out infinite",
      },
      boxShadow: {
        "neon-gold": "0 0 5px theme(colors.gold.400), 0 0 10px theme(colors.gold.400), 0 0 20px theme(colors.gold.500), 0 0 30px theme(colors.gold.500)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
  // Performance optimizations
  future: {
    hoverOnlyWhenSupported: true,
  },
} satisfies Config;
