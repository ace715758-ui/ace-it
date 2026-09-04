import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdfjs-dist'],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Increase the body size limit buffered by the proxy layer from 10MB to 55MB
    // This is required for large file uploads (PDF, PPTX, DOCX up to 50MB)
    proxyClientMaxBodySize: '55mb',
    // Also increase server actions limit
    serverActions: {
      bodySizeLimit: '55mb',
    },
  },
}

export default nextConfig
