process.env.NODE_ENV = 'production';

const tasks = require('./webpack-tasks');
tasks.build();
