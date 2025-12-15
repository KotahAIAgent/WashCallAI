/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude mobile-app directory from Next.js build
  // It's a separate Expo/React Native project
  webpack: (config) => {
    // Ignore expo/react-native modules if they somehow get imported
    config.resolve.alias = {
      ...config.resolve.alias,
      'expo-router': false,
      'expo': false,
      'react-native': false,
    }
    return config
  },
}

module.exports = nextConfig
