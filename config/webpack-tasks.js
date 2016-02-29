/* eslint no-console: 0 */

const _ = require('lodash');
const webpack = require('webpack');
const webpackConfigs = require('./webpack-configs');
const backendConfig = webpackConfigs.backendConfig;
const backendTestConfig = webpackConfigs.backendTestConfig;

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
    build(callback) {
        webpack(backendConfig).run((err, stats) => {
            handleWebpackResults(err, stats);
            callback && callback(err);
        });
    },

    buildTests(callback) {
        webpack(backendTestConfig).run((err, stats) => {
            handleWebpackResults(err, stats);
            callback && callback(err);
        })
    },

    watch(completedCallback, restartCallback) {
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
