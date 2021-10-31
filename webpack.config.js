const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const DIST = path.resolve(__dirname, 'dist')

const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    resolve: { 
      fallback: { 
        stream: require.resolve('stream-browserify') ,
      }
     },
    devtool: 'eval-source-map',
    entry: './src/index.js',
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        new CopyPlugin({
          patterns: [
            {
              flatten: true,
              from: './src/*',
            },
          ],
        }),
    ],
    output: {
        library: {
            name: 'playground',
            type: 'window',
            export: 'playground',
        },
        filename: 'bundle.js',
        path: DIST,
        // publicPath: DIST,
    },
    devServer: {
        port: 9011,
        static: DIST,
    },
};
