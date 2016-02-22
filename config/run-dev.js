/* eslint no-console: 0 */

const path = require('path');
const nodemon = require('nodemon');
const _ = require('lodash');
const tasks = require('./webpack-tasks');

function log() {
    console.log.apply(console, ['~webpack:'].concat(_.toArray(arguments)));
}

tasks.watch(
    function onCompleted(err) {
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
    },
    function onRestarted() {
        nodemon.restart();
    }
);
