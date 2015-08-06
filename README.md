# gulp-kissy-transport

提取kissy深层依赖

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

['./test/app','./test/components']程序解析为kissy的包配置
    
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
