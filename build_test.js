var gulp = require('gulp')
var extracter = require('./index.js')

extracter.config('packages', [{
    name: 'app',
    path: './test/app'
}, {
    name: 'components',
    path: './test/components'
}, {
    name: 'common',
    path: './test/app'
}])
gulp.src(['./test/**/*.js', '!./test/build/**/*.js', '!./test/transport-test.js'])
    .pipe(extracter.deepenDeps())
    .pipe(gulp.dest('./test/build'))
    .on('end', function (res) {
        console.log(extracter.rootMod)
    })

