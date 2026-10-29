/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The membership page used to live at /member.
  async redirects() {
    return [{ source: "/member", destination: "/membership", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
