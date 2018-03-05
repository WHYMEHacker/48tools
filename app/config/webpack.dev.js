/* 开发环境 */
const path = require('path');
const os = require('os');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HappyPack = require('happypack');
const config = require('./webpack.config');
const cssConfig = require('./css.config');
const sassConfig = require('./sass.config');

const happyThreadPool = HappyPack.ThreadPool({
  size: os.cpus().length
});

/* 合并配置 */
module.exports = config({
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'script/[name].js',
    chunkFilename: 'script/[name]_chunk.js'
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      { // sass
        test: /^.*\.sass$/,
        use: ['happypack/loader?id=sass']
      },
      { // css
        test: /^.*\.css$/,
        use: ['happypack/loader?id=css']
      },
      { // pug
        test: /^.*\.pug$/,
        use: [
          {
            loader: 'pug-loader',
            options: {
              pretty: true,
              name: '[name].html'
            }
          },
          {
            loader: 'nwjs-webpack-hot-loader/loader',
            options: {
              buildFile: './build',
              rootFile: 'script/app.js',
              type: 'pug'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // html模板
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: true,
      hash: true,
      template: path.join(__dirname, '../src/index.pug'),
      excludeChunks: ['videoPlay']
    }),
    new HtmlWebpackPlugin({
      filename: 'videoPlay.html',
      inject: true,
      hash: true,
      template: path.join(__dirname, '../src/modules/VideoPlay/videoPlay.pug'),
      excludeChunks: ['app']
    }),
    new HappyPack({
      id: 'sass',
      loaders: ['style-loader', cssConfig, sassConfig],
      threadPool: happyThreadPool
    }),
    new HappyPack({
      id: 'css',
      loaders: ['style-loader', 'css-loader'],
      threadPool: happyThreadPool
    })
  ]
});