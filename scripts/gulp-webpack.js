/* eslint no-console: 0 */

const webpack = require('webpack');
const path = require('path');
const _ = require('lodash');
const nodemon = require('nodemon');
const webpackConfigs = require('./webpack-configs');

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
        webpack(webpackConfigs.backendConfig).run((err, stats) => {
            handleWebpackResults(err, stats);
            done();
        });
    },

    buildBackendTests(done) {
        webpack(webpackConfigs.backendTestConfig).run((err, stats) => {
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
        const backendCompiler = webpack(webpackConfigs.backendConfig);
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