KISSY.add('app/index', function (S, Node, Feature) {
    //...
    console.log('hi, module app/index start')
}, {
    requires: [
        'node',
        '../components/feature/',
        'components/feature_3/index.js',
        './doMore'
    ]
})
KISSY.add('common/index', function () {
    console.log('from path app/index, module name is common/index')
}, {
    requires: [
        './doMore'
    ]
})
