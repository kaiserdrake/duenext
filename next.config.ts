import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Profile and user management moved under /settings; keep old bookmarks working.
  async redirects() {
    return [
      { source: "/profile", destination: "/settings/profile", permanent: false },
      { source: "/admin/users/:path*", destination: "/settings/users/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
