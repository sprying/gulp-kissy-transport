var assert = require('assert');
var transport = require('../index.js');
var gulp = require('gulp');
var fs = require('fs');
var through = require('through2');
describe('test begin',function(){
	it('transport index.js should equal the target',function(done){
		this.timeout(5000);
		var targContent = fs.readFileSync('./test/build/app/index.js');
		gulp.src(['./test/app/index.js'])
		    .pipe(transport(['./test/app','./test/components']))
		    .pipe(through.obj(function(file,encode,callback){
				assert.equal(file.contents.toString(),targContent);	
				done();
				callback(null, file);
		     }));
	});

});
