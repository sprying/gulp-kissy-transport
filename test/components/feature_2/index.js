KISSY.add('components/feature_2/util',function(S){
    //...
    console.log('from path components/feature_2/index, module name is components/feature_2/util')
},{
    requires: [
        'ajax'
    ]
})
KISSY.add('components/feature_2/',function(S,Base){
    //...
    console.log('from path components/feature_2/index, module name is components/feature_2/')
    Base.print()
},{
    requires:['./base','json','./tool.js']
})

KISSY.add('components/feature_2/base',function(S){
    //...
    console.log('from path components/feature_2/index, module name is components/feature_2/base')
    return {
        print:function(){
            console.log("execute component/feature_base method of print")
        }
    }
},{
    requires: ['./util.js']
})
