import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Viesa huisstijl
        navy: "#19445B", // primaire kleur
        oranje: "#F26B21", // enig accent
        achtergrond: "#F4F6F9", // paginabachtergrond
      },
    },
  },
  plugins: [],
};

export default config;
