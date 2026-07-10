/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática para GitHub Pages (carpeta ./out con index.html).
  output: "export",
  trailingSlash: true,
  images: {
    // GitHub Pages no tiene servidor de optimización de imágenes.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
