# gulp-kissy-transport [![Build Status](http://img.shields.io/travis/sprying/gulp-kissy-transport.svg)](https://travis-ci.org/sprying/gulp-kissy-transport.svg) [![](http://img.shields.io/npm/v/gulp-kissy-transport.svg?style=flat)](https://www.npmjs.org/package/gulp-kissy-transport)

提取kissy深层依赖

适用于kissy1.2+以上版本，不适合kissy5.0+

### 提取前

>app/index.js

    KISSY.add('app/index',function(S,Node,Feature){
      //...
    },{
      requires:['node','components/feature/']
    })

>components/feature/index.js

    KISSY.add('components/feature/',function(S,io){
      //...
    },{
      requires:['io']
    })


### 配置gulp

    var extracter = require('gulp-kissy-transport')
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
    gulp.src(['./test/**/*.js','!./test/build/**/*.js'])
        .pipe(extracter.deepenDeps())
        .pipe(gulp.dest('./test/build'))

首先配置kissy的包，参考对比[kissy包配置详情](http://docs.kissyui.com/1.4/docs/html/guideline/kmd.html#config-name-pkg-)

### 提取后

app/index.js

    KISSY.add('app/index',function(S,Node,Feature){
      //...
    },{
      requires:['node','components/feature/','io']
    })


### 查看演示demo

mat服务可以支持combo请求

>npm install mat -g
>mat

http://127.0.0.1:8989/examples/test.html?debug

http://127.0.0.1:8989/examples/test.html
