// Formato CommonJS (next.config.js) requerido: actions/configure-pages
// inyecta aquí el basePath correcto al desplegar en GitHub Pages.
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

module.exports = nextConfig;
