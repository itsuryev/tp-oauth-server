const tasks = require('./pg-tasks');
const testsConfig = require('../../tests/config.tests.json');
tasks.localRebuildWithSampleData(testsConfig.postgresConnectionString);