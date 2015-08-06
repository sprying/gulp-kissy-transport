KISSY.add('components/feature_2/',function(S){
    //...
},{
    requires:['ajax','json']
})
KISSY.add('components/feature_2/util',function(S){
    //...
},{
    requires: [
        'ajax',
        './tool'
    ]
})
