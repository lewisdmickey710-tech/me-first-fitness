/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next's server action default is 1MB, well under a real phone
    // photo/video -- match the form-checks storage bucket's own 50MB
    // cap (see 0029_form_check_media.sql) so uploads aren't rejected
    // by this layer before they ever reach storage.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
