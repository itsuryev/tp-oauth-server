const gulp = require('gulp');
const runSequence = require('run-sequence');
const webpackTasks = require('./scripts/gulp-webpack');
const pgTasks = require('./scripts/gulp-pg');
const applicationConfig = require('./config/config.private.json');
const testsConfig = require('./config/config.tests.json');

gulp.task('backend-build', webpackTasks.buildBackend);
gulp.task('backend-tests-build', webpackTasks.buildBackendTests);
gulp.task('watch', webpackTasks.watch);

const pgAppConnectionString = applicationConfig.postgresConnectionString;
gulp.task('db-drop', done => pgTasks.dropEverything(pgAppConnectionString, done));
gulp.task('db-create', done => pgTasks.createDatabase(pgAppConnectionString, done));
gulp.task('db-sample', done => pgTasks.createSampleData(pgAppConnectionString, done));
gulp.task('db-recreate-sample', done => runSequence(
    'db-drop', 'db-create', 'db-sample',
    done));

const pgTestConnectionString = testsConfig.postgresConnectionString;
gulp.task('db-test-drop', done => pgTasks.dropEverything(pgTestConnectionString, done));
gulp.task('db-test-create', done => pgTasks.createDatabase(pgTestConnectionString, done));
gulp.task('db-test-sample', done => pgTasks.createSampleData(pgTestConnectionString, done));

gulp.task('tests-prepare', done => runSequence(
    'backend-tests-build',
    'db-test-drop', 'db-test-create',
    done));