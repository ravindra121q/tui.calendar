const pkg = require('./package.json');
const path = require('path');
const webpack = require('webpack');
const SafeUmdPlugin = require('safe-umd-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = (__, argv) => {
  const { minify } = argv;
  const filename = `${pkg.name}${minify ? '.min' : ''}.js`;
  const banner = [
    'TOAST UI Calendar',
    `@version ${pkg.version} | ${new Date().toDateString()}`,
    `@author ${pkg.author}`,
    `@license ${pkg.license}`
  ].join('\n');

  const config = {
    output: {
      library: ['tui', 'Calendar'],
      libraryTarget: 'umd',
      libraryExport: 'default',
      path: path.join(__dirname, 'dist'),
      filename,
      publicPath: '/dist'
    },
    externals: {
      'tui-date-picker': {
        commonjs: 'tui-date-picker',
        commonjs2: 'tui-date-picker',
        amd: 'tui-date-picker',
        root: ['tui', 'DatePicker']
      },
      'tui-time-picker': {
        commonjs: 'tui-time-picker',
        commonjs2: 'tui-time-picker',
        amd: 'tui-time-picker',
        root: ['tui', 'TimePicker']
      }
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@src': path.resolve(__dirname, './src/ts/')
      }
    },
    plugins: [
      new SafeUmdPlugin(),
      new webpack.BannerPlugin({
        banner,
        entryOnly: true
      })
    ],
    optimization: {
      minimize: false
    },
    devtool: 'source-map'
  };

  if (Boolean(minify)) {
    config.optimization = {
      minimize: true,
      minimizer: [new TerserPlugin({ extractComments: false }), new OptimizeCSSAssetsPlugin()]
    };
  }

  return config;
};