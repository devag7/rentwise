/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow rendering images from local base64/data URIs inside Next.js image component
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Ensure we output standalone build for optimized Docker container size
    output: 'standalone',
};

export default nextConfig;
