/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg is a Node-native driver; keep it out of the webpack bundle
  experimental: { serverComponentsExternalPackages: ["pg"] },
};

export default nextConfig;
