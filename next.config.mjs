/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  sassOptions: {
    // Позволяет импортировать файлы из папки src/styles/ без относительных путей
    includePaths: ['./src/styles'], 
  },
};

export default nextConfig;
