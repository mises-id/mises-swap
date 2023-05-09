import path from "path";

const CracoLessPlugin = require('craco-less');
// const CracoAlias = require("craco-alias");
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#1DA57A' },
            javascriptEnabled: true,
          },
        },
      },
    }
  ],
  webpack: {
    configure: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
      plugins: [
        new NodePolyfillPlugin({
          excludeAliases: ['console']
        }),
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: "pre",
            use: ["source-map-loader"],
          },
        ],
      },
      ignoreWarnings: [/Failed to parse source map/],
    }
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      }
    }
  }
};