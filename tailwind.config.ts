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
        // Accent-token. Historisch 'oranje'; nu een rustiger teal/petrol dat
        // beter bij het navy past. De klassenaam blijft 'oranje' zodat het
        // accent overal in één keer meeverandert.
        oranje: "#1E9E93",
        achtergrond: "#F4F6F9", // paginabachtergrond
      },
    },
  },
  plugins: [],
};

export default config;
