/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude mobile-app directory from Next.js build
  // It's a separate Expo/React Native project
  webpack: (config, { isServer }) => {
    config.externals = config.externals || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      'expo-router': false,
      'expo': false,
      'react-native': false,
    }
    return config
  },
  // Ignore patterns during build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
}

module.exports = nextConfig
