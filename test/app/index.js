KISSY.add('app/index', function (S, Node, Feature) {
    //...
    console.log('hi')
}, {
    requires: [
        'node',
        'components/feature/',
        'components/feature_3/index.js'
    ]
})
