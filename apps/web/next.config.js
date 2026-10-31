/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com",
    NEXT_PUBLIC_BOLNA_MODE: process.env.NEXT_PUBLIC_BOLNA_MODE || "real",
  },
};

module.exports = nextConfig;

