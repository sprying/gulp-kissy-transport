# gulp-kissy-transport [![Build Status](http://img.shields.io/travis/sprying/gulp-kissy-transport.svg)](https://travis-ci.org/sprying/gulp-kissy-transport.svg) [![](http://img.shields.io/npm/v/gulp-kissy-transport.svg?style=flat)](https://www.npmjs.org/package/gulp-kissy-transport)
提取kissy深层依赖

适用于kissy1.2+以上版本，不适合kissy5.0+
###提取前
app/index.js

    KISSY.add('app/index',function(S,Node,Feature){
      //...
    },{
      requires:['node','components/feature/']
    })

components/feature/index.js

    KISSY.add('components/feature/',function(S,io){
      //...
    },{
      requires:['io']
    })

###配置gulp    

    gulp.src(['./test/**/*.js','!./test/build/**/*.js'])
        .pipe(transport(['./test/app','./test/components']))
        .pipe(gulp.dest('./test/build'))

['./test/app','./test/components']kissy的包配置
    
| 包名        | 路径名              |
| ------------|:-------------------:|
| app         | ./test/app          |
| components  | ./test/components   |

###提取后
app/index.js

    KISSY.add('app/index',function(S,Node,Feature){
      //...
    },{
      requires:['node','components/feature/','io']
    })
###查看演示demo
mat服务可以支持combo请求

npm install mat -g

mat

http://127.0.0.1:8989/test/test.html?debug

http://127.0.0.1:8989/test/test.html
