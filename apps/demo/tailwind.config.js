/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'display': ['Orbitron', 'monospace'],
        'heading': ['JetBrains Mono', 'monospace'],
        'mono': ['JetBrains Mono', 'monospace'],
        'body': ['Inter', 'sans-serif'],
        'special': ['Jura', 'sans-serif'],
      },
      colors: {
        bg: '#0B101A',
        primary: '#00E5FF',
        accent: '#E144FF',
        secondary: '#9D68FF',
        surface: 'rgba(255,255,255,0.06)',
        text: 'rgba(255,255,255,0.9)',
        'electric-cyan': '#00FFFF',
        'vibrant-magenta': '#FF00FF',
        'deep-black': '#000000',
        'translucent-white': 'rgba(255, 255, 255, 0.15)',
        neonCyan: '#00ffff',
        neonMagenta: '#ff00ff',
      },
      boxShadow: {
        'holo-glow': '0 0 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.3)',
        'holo-glow-magenta': '0 0 20px rgba(255, 0, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.2)',
        'holo-glow-mixed': '0 0 20px rgba(0, 255, 255, 0.2), 0 0 40px rgba(255, 0, 255, 0.1)',
        'edge-lighting': '0 0 30px rgba(0, 255, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'edge-glow-pulse': 'edge-glow-pulse 4s ease-in-out infinite',
        'gradient-rotation': 'gradient-rotation 3s linear infinite',
        'holographic-scan': 'holographic-scan-line 6s linear infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
