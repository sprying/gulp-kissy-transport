var gulp = require('gulp')
var transport = require('./index.js')

gulp.src(['./test/**/*.js','!./test/build/**/*.js','./test/transport-test.js'])
    .pipe(transport(['./test/app','./test/components']))
    .pipe(gulp.dest('./test/build'))

