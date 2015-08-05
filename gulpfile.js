var gulp = require('gulp')
var transport = require('./index.js')
var clean     = require('gulp-clean')

gulp.src(['./test/**/*.js','!./test/build/**/*.js'])
    .pipe(transport(['./test/app','./test/components']))
    .pipe(gulp.dest('./test/build'))

