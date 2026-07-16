/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Client-side router-cache langer vasthouden, zodat een al bezochte pagina
    // bij het terugklikken direct uit het geheugen komt (geen nieuwe server-
    // round-trip). Mutaties roepen `revalidatePath` aan en verversen alsnog.
    //   dynamic: seconden dat een dynamische pagina "vers" blijft in de cache
    //   static:  idem voor statische segmenten
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },
};

export default nextConfig;
