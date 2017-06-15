var assert = require('assert')
var extracter = require('../index.js')
var gulp = require('gulp')
var fs = require('fs')
var through = require('through2')
describe('verify files', function () {
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
    it('verify app/index.js is ok', function (done) {
        this.timeout(5000)
        gulp.src(['./test/app/index.js'])
            .pipe(extracter.deepenDeps())
            .pipe(through.obj(function (file, encode, callback) {
                var targContent = fs.readFileSync(file.path.replace(/(test\/)/, '$1build/'));
                assert.equal(file.contents.toString(), targContent);
                callback(null, file);
                done();
            }))
    })
    it('verify components/feature/index.js is ok', function (done) {
        this.timeout(5000);
        gulp.src(['./test/components/feature/index.js'])
            .pipe(extracter.deepenDeps())
            .pipe(through.obj(function (file, encode, callback) {
                var targContent = fs.readFileSync(file.path.replace(/(test\/)/, '$1build/'));
                assert.equal(file.contents.toString(), targContent);
                callback(null, file);
                done();
            }))
    })
    it('verify components/feature/util.js is ok', function (done) {
        this.timeout(5000);
        gulp.src(['./test/components/feature/util.js'])
            .pipe(extracter.deepenDeps())
            .pipe(through.obj(function (file, encode, callback) {
                var targContent = fs.readFileSync(file.path.replace(/(test\/)/, '$1build/'));
                assert.equal(file.contents.toString(), targContent);
                callback(null, file);
                done();
            }))
    })
    it('verify components/feature_2/index.js is ok', function (done) {
        this.timeout(5000);
        gulp.src(['./test/components/feature_2/index.js'])
            .pipe(extracter.deepenDeps())
            .pipe(through.obj(function (file, encode, callback) {
                var targContent = fs.readFileSync(file.path.replace(/(test\/)/, '$1build/'));
                assert.equal(file.contents.toString(), targContent);
                callback(null, file);
                done();
            }))
    })
    it('verify components/feature_2/tool.js is ok', function (done) {
        this.timeout(5000);
        gulp.src(['./test/components/feature_2/tool.js'])
            .pipe(extracter.deepenDeps())
            .pipe(through.obj(function (file, encode, callback) {
                var targContent = fs.readFileSync(file.path.replace(/(test\/)/, '$1build/'));
                assert.equal(file.contents.toString(), targContent);
                callback(null, file);
                done();
            }))
    })
})
