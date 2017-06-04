KISSY.add('app/index', function (S, Node, Feature) {
    console.log('hi');
}, {
    requires: [
        'node',
        'components/feature/',
        'components/feature_3/index.js',
        'io',
        'components/feature/util',
        'components/feature_2/index',
        'json',
        'components/feature_2/tool',
        'dd',
        'resizable',
        'ajax',
        'xtemplate'
    ]
});