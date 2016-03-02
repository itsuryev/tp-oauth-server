const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

const globalExclude = /node_modules/;

// Despite this file being located in /scripts, all paths are specified relative to the root
function ofAppPath(relative) {
    return path.join(path.resolve(__dirname, '..'), relative);
}

const backendConfig = {
    resolve: {
        extensions: ['', '.js', '.ts']
    },
    entry: ofAppPath('server/server.ts'),
    module: {
        loaders: [
            { test: /\.json$/, loader: 'json-loader', exclude: globalExclude },
            { test: /\.ts$/, loader: 'babel?presets[]=es2015!ts-loader', exclude: globalExclude },
            { test:/\.css$/, loader: ExtractTextPlugin.extract('style', 'css'), exclude: globalExclude },
            { test: /\.(png|gif|jpe?g|svg)$/i, loader: 'url?limit=10000', exclude: globalExclude }
        ]
    },
    plugins: [
        new ExtractTextPlugin('bundle-[hash].css'),

        require('progress-bar-webpack-plugin')({
            format: '  build [:bar] :percent (:elapsed seconds)',
            clear: false
        }),

        new webpack.optimize.OccurenceOrderPlugin(),

        new AssetsPlugin({
            filename: 'assets.json',
            path: ofAppPath('build')
        })
    ],
    target: 'node',
    output: {
        path: ofAppPath('build'),
        filename: 'backend.js'
    },
    node: {
        __dirname: true,
        __filename: true
    },
    externals: fs.readdirSync(ofAppPath('node_modules'))
        .filter(x => ['.bin'].indexOf(x) === -1)
        .reduce((acc, mod) => {
            acc[mod] = 'commonjs ' + mod;
            return acc;
        }, {})
};

if (process.env.NODE_ENV !== 'production') {
    backendConfig.devtool = '#eval-source-map';
    backendConfig.debug = true;
}

const backendTestConfig = _.extend(_.cloneDeep(backendConfig), {
    entry: ofAppPath('tests/index.ts'),
    output: {
        path: ofAppPath('tests'),
        filename: 'index.js'
    }
});

module.exports = {
    backendConfig,
    backendTestConfig
};