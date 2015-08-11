KISSY.add('components/feature_2/util',function(S){
    //...
},{
    requires: [
        'ajax'
    ]
})
KISSY.add('components/feature_2/base',function(S){
    //...
    return {
        print:function(){
            console.log("Year, I'm from base")
        }
    }
},{
    requires: ['./util.js']
})
KISSY.add('components/feature_2/',function(S,Base){
    //...
    console.log("I'm in index.js")
    Base.print()
},{
    requires:['./base','json','./tool.js']
})

