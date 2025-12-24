const path = require('path');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const common = require('./webpack.common.js');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return merge(common, {
    entry: './src/widget/index.jsx',
    output: {
      filename: 'widget.js',
      path: path.resolve(__dirname, '../dist/widget'),
      library: {
        name: 'LLMGatewayWidget',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, '../public'),
      },
      port: 3001,
      hot: true,
      open: true,
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: 'llm-widget__[local]__[hash:base64:5]',
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'widget.css',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.APP_MODE': JSON.stringify('widget'),
      }),
    ],
    optimization: {
      splitChunks: false,
    },
    externals: [],
  });
};
