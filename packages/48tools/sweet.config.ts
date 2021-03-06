import * as process from 'process';
import * as path from 'path';
import AntdDayjsWebpackPlugin from 'antd-dayjs-webpack-plugin';

const isDev: boolean = process.env.NODE_ENV === 'development';

function nodeExternals(node: Array<string>): { [k: string]: string } {
  const result: { [k: string]: string } = {};

  for (const name of node) {
    result[name] = `globalThis.require('${ name }')`;
  }

  return result;
}

export default function(info: object): { [key: string]: any } {
  const plugins: Array<any> = [
    ['import', { libraryName: 'antd', libraryDirectory: 'es', style: true }]
  ];

  if (!isDev) {
    plugins.unshift(['transform-react-remove-prop-types', { mode: 'remove', removeImport: true }]);
  }

  const config: { [key: string]: any } = {
    frame: 'react',
    dll: [
      'react',
      'react-dom',
      'prop-types',
      '@reduxjs/toolkit',
      'react-redux',
      'reselect',
      'react-router',
      'react-router-dom',
      'history'
    ],
    entry: {
      index: [path.join(__dirname, 'src/index.tsx')],
      player: [path.join(__dirname, 'src/pages/48/Pocket48/Player/Player.tsx')]
    },
    html: [
      { template: path.join(__dirname, 'src/index.pug'), excludeChunks: ['player'] },
      { template: path.join(__dirname, 'src/pages/48/Pocket48/Player/player.pug'), excludeChunks: ['index'] }
    ],
    externals: nodeExternals([
      'child_process',
      'fs',
      'net',
      'path',
      'process',
      'querystring',
      'stream',
      'url',
      'util',
      'electron',
      'got',
      'jsdom',
      'node-media-server'
    ]),
    js: {
      ecmascript: true,
      plugins,
      exclude: /node_modules/i
    },
    ts: {
      configFile: isDev ? 'tsconfig.json' : 'tsconfig.prod.json',
      plugins,
      exclude: /node_modules/
    },
    sass: {
      include: /src/
    },
    css: {
      modifyVars: {
        // https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
        '@primary-color': '#13c2c2'
      },
      include: /node_modules[\\/]_?antd/,
      exclude: /dark-?Theme/i
    },
    rules: [
      {
        test: /antd-dark\.(min\.)?css/,
        use: [{
          loader: 'file-loader',
          options: {
            name: isDev ? '[name]_[hash:5].[ext]' : '[name]_[hash:15].[ext]'
          }
        }]
      }
    ],
    plugins: [new AntdDayjsWebpackPlugin()]
  };

  return config;
}