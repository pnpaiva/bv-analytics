import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'heading': ['Work Sans', 'sans-serif'],
				'subheading': ['Work Sans', 'sans-serif'],
				'body': ['Work Sans', 'sans-serif'], // Fallback for Acumin Variable Concept
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
					dark: "hsl(var(--brand-primary-dark))"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				success: {
					DEFAULT: "hsl(var(--success))",
					foreground: "hsl(var(--success-foreground))"
				},
				warning: {
					DEFAULT: "hsl(var(--warning))",
					foreground: "hsl(var(--warning-foreground))"
				},
				// Brand-specific colors
				brand: {
					primary: "hsl(var(--brand-primary))",
					"primary-dark": "hsl(var(--brand-primary-dark))",
					green: "hsl(var(--brand-accent-green))",
					black: "hsl(var(--brand-black))",
					white: "hsl(var(--brand-white))",
					pink: "hsl(var(--brand-pink))",
					orange: "hsl(var(--brand-orange))",
					"light-blue": "hsl(var(--brand-light-blue))",
					mint: "hsl(var(--brand-mint))",
				},
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"brand-pulse": {
					"0%, 100%": { 
						"box-shadow": "0 0 0 0 hsl(var(--brand-primary) / 0.4)" 
					},
					"50%": { 
						"box-shadow": "0 0 0 10px hsl(var(--brand-primary) / 0)" 
					},
				},
				"flowing-line": {
					"0%": { transform: "translateX(-100%)" },
					"100%": { transform: "translateX(100%)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-out",
				"brand-pulse": "brand-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"flowing-line": "flowing-line 3s ease-in-out infinite",
			},
			spacing: {
				'brand': '1.5rem', // Minimum spacing equivalent to logo "b" height
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;