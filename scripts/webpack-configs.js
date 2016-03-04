const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const DeepMerge = require('deep-merge');
const webpack = require('webpack');
const HashPlugin = require('hash-webpack-plugin');

const globalExclude = /node_modules/;
const nodeExternals = fs.readdirSync(ofAppPath('node_modules'))
    .filter(x => ['.bin'].indexOf(x) === -1)
    .reduce((acc, mod) => {
        acc[mod] = 'commonjs ' + mod;
        return acc;
    }, {});

nodeExternals['react-dom/server'] = 'commonjs react-dom/server';

// Despite this file being located in /scripts, all paths are specified relative to the root
function ofAppPath(relative) {
    return path.join(path.resolve(__dirname, '..'), relative);
}

function createConfig(overrides) {
    const baseConfig = {
        resolve: {
            extensions: ['']
        },
        module: {
            loaders: [

            ]
        },
        plugins: [
            require('progress-bar-webpack-plugin')({
                format: '  build [:bar] :percent (:elapsed seconds)',
                clear: false
            }),

            new webpack.optimize.OccurenceOrderPlugin()
        ]
    };

    if (process.env.NODE_ENV !== 'production') {
        baseConfig.devtool = 'eval';
        baseConfig.debug = true;
    }

    const merge = DeepMerge((target, source) => {
        return (target instanceof Array) ?
            [].concat(target, source) :
            source;
    });

    return merge(baseConfig, overrides || {});
}

const backendConfig = createConfig({
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    entry: ofAppPath('server/server.ts'),
    module: {
        loaders: [
            { test: /\.json$/, loader: 'json-loader', exclude: globalExclude },
            { test: /\.tsx?$/, loader: 'babel?presets[]=es2015!ts-loader', exclude: globalExclude }
        ]
    },
    target: 'node',
    output: {
        path: ofAppPath('build'),
        filename: 'backend.js'
    },
    node: {
        __dirname: true,
        __filename: true
    },
    externals: nodeExternals
});

const clientBundleConfig = createConfig({
    entry: {
        'oauth-confirm': ofAppPath('server/assets/oauth-confirm/index.js')
    },
    module: {
        loaders: [
            { test: /\.(png|gif|jpe?g|svg)$/i, loader: 'file?context=server/assets&name=[path][name].[ext]?h=[hash]', exclude: globalExclude },
            { test: /\.css$/, loader: 'style!css', exclude: globalExclude }
        ]
    },
    plugins: [
        new HashPlugin({ path: './build', fileName: 'client-bundles-hash.txt' })
    ],
    output: {
        path: ofAppPath('build/static'),
        publicPath: './static/',
        filename: '[name]/bundle.js'
    }
});

const backendTestConfig = _.extend(_.cloneDeep(backendConfig), {
    entry: ofAppPath('tests/index.ts'),
    output: {
        path: ofAppPath('build'),
        filename: 'tests.js'
    }
});

module.exports = {
    backendConfig: [clientBundleConfig, backendConfig],
    backendTestConfig
};
