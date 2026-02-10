/**
 * Webpack config for development electron main process.
 *
 * Electron 33+ (Node 20.18+) no longer supports ts-node/register for loading
 * .ts files at runtime because the ESM module format checker rejects unknown
 * extensions before ts-node's CJS hooks can intercept them. Instead we
 * pre-compile the main process with webpack (fast, no minification) and then
 * launch Electron on the resulting JS bundle.
 */

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import Dotenv from 'dotenv-webpack';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';

const configuration: webpack.Configuration = {
  devtool: 'inline-source-map',

  mode: 'development',

  target: 'electron-main',

  entry: {
    main: path.join(webpackPaths.srcMainPath, 'main.ts'),
    preload: path.join(webpackPaths.srcMainPath, 'preload.js'),
  },

  output: {
    path: webpackPaths.distMainPath,
    filename: '[name].js',
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),
    new Dotenv({ ignoreStub: true }),
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
};

export default merge(baseConfig, configuration);
