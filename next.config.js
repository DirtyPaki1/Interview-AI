/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add this block to ensure pdfjs-dist is handled correctly
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/pdfjs-dist/,
      type: 'javascript/auto',
    });

    return config;
  },
};

module.exports = nextConfig;
