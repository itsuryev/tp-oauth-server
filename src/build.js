'use strict';

var config = require('./webpack.config');
var webpack = require('webpack');

var compiler = webpack(config);
compiler.run((err, stats) => {
    if (err) {
        throw err;
    }
    console.log(stats.toString());
});