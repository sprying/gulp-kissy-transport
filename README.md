# gulp-kissy-transport

提取kissy深层依赖

提取前
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

提取后
app/index.js
  KISSY.add('app/index',function(S,Node,Feature){
    //...
  },{
    requires:['node','components/feature/','io']
  })
