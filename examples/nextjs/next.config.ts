import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  webpack: (config) => {
    // @klappay/one's "./react" export only declares an "import" condition
    // (no "require"/"default"), which trips up webpack's resolver for a
    // code-split dynamic import() specifically — aliasing straight to the
    // built file sidesteps that without touching the package itself.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@klappay/one/react': path.resolve(
        process.cwd(),
        'node_modules/@klappay/one/dist/react/index.js',
      ),
    }
    return config
  },
}

export default nextConfig
