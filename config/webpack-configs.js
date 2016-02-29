const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const _ = require('lodash');
const globalExclude = /node_modules/;

// Despite this file being located in /config, all paths are specified relative to the root
function ofAppPath(relative) {
    return path.join(path.resolve(__dirname, '..'), relative);
}

const backendConfig = {
    resolve: {
        extensions: ['', '.js', '.ts']
    },
    module: {
        loaders: [
            { test: /\.json$/, loader: 'json-loader', exclude: globalExclude },
            { test: /\.ts$/, loader: 'ts-loader', exclude: globalExclude }
        ]
    },
    plugins: [
        require('progress-bar-webpack-plugin')({
            format: '  build [:bar] :percent (:elapsed seconds)',
            clear: false
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    ],

    // backend-specific
    entry: ofAppPath('server/server.ts'),
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
