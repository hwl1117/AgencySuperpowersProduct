/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用严格模式
  reactStrictMode: true,
  
  // 环境变量
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000',
  },
  
  // API代理配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
  
  // 图片域名配置
  images: {
    domains: [
      'localhost',
      'via.placeholder.com',
    ],
  },
  
  // 输出配置
  output: 'standalone',
}

module.exports = nextConfig