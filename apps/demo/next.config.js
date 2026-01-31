const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignore TypeScript errors during build for hackathon speed
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable experimental features for WASM
  experimental: {
    asyncWebAssembly: true,
  },
  // Configure webpack to handle TypeScript from SDK
  webpack: (config, { defaultLoaders, isServer }) => {
    const sdkPath = path.resolve(__dirname, '../../packages/sdk/src');
    const appNodeModules = path.resolve(__dirname, 'node_modules');
    
    // Add the SDK source directory to webpack's resolve
    config.resolve.alias = {
      ...config.resolve.alias,
      '@prism-protocol/sdk': sdkPath,
    };
    
    // Resolve modules from this app's node_modules first (fixes Vercel: @noir-lang/noir_js)
    config.resolve.modules = [
      appNodeModules,
      path.resolve(__dirname, '../../packages/sdk/node_modules'),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : ['node_modules']),
    ];
    
    // For client-side builds, mark Node.js modules as externals
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Enable WASM support for Noir/Aztec
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Find and modify the existing oneOf rule that handles TypeScript
    const oneOfRule = config.module.rules.find(
      (rule) => typeof rule.oneOf === 'object'
    );
    
    if (oneOfRule && oneOfRule.oneOf) {
      // Find the TypeScript rule in oneOf
      const tsRuleIndex = oneOfRule.oneOf.findIndex(
        (rule) => rule.test && rule.test.toString().includes('tsx?')
      );
      
      if (tsRuleIndex !== -1) {
        const tsRule = oneOfRule.oneOf[tsRuleIndex];
        // Modify the include to also include SDK
        if (tsRule.include) {
          if (Array.isArray(tsRule.include)) {
            tsRule.include.push(sdkPath);
          } else {
            tsRule.include = [tsRule.include, sdkPath];
          }
        } else {
          tsRule.include = sdkPath;
        }
      } else {
        // Add a new rule for SDK TypeScript files
        oneOfRule.oneOf.unshift({
          test: /\.tsx?$/,
          include: [sdkPath],
          use: defaultLoaders.babel,
        });
      }
    }
    
    return config;
  },
}

module.exports = nextConfig
