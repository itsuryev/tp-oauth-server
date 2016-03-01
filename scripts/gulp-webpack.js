/* eslint no-console: 0 */

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const nodemon = require('nodemon');
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
            { test: /\.ts$/, loader: 'babel?presets[]=es2015!ts-loader', exclude: globalExclude }
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

function log() {
    console.log.apply(console, ['~webpack:'].concat(_.toArray(arguments)));
}

function handleWebpackResults(err, stats) {
    if (err) {
        log('Error', err);
    } else {
        log('Task completed', stats.toString({
            errors: true,
            warnings: true,
            version: false,
            hash: false,
            chunks: false
        }));
    }
}

module.exports = {
    buildBackend(done) {
        webpack(backendConfig).run((err, stats) => {
            handleWebpackResults(err, stats);
            done();
        });
    },

    buildBackendTests(done) {
        webpack(backendTestConfig).run((err, stats) => {
            handleWebpackResults(err, stats);
            done();
        });
    },

    watch(done) {
        function completedCallback(err) {
            if (!err) {
                log('Initial build completed, starting nodemon');

                nodemon({
                    execMap: {js: 'node'},
                    script: path.join(__dirname, '../build/backend.js'),
                    ignore: ['*'],
                    watch: ['__ignored__/'],
                    ext: 'noop'
                }).on('restart', () => {
                    log('Nodemon restarted');
                });
            }

            done();
        }

        function restartCallback() {
            nodemon.restart();
        }

        var completedCalled = false;
        const backendCompiler = webpack(backendConfig);
        backendCompiler.watch({}, (err, stats) => {
            log('Backend callback');
            handleWebpackResults(err, stats);

            if (!completedCalled) {
                completedCalled = true;
                completedCallback(err);
            } else {
                restartCallback(err);
            }
        });
    }
};