var gulp = require('gulp')
var trans = require('./index.js')

gulp.src(['./test/**/*.js','!./test/build/**/*.js','!./test/transport-test.js'])
    .pipe(trans.transport(['./test/app','./test/components']))
    .pipe(gulp.dest('./test/build'))
    .on('end', function(res){
       console.log(trans.rootMod)
    })

