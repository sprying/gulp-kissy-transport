KISSY.add('app/index', function (S, Node, Feature) {
    console.log('hi');
}, {
    requires: [
        'node',
        'components/feature/',
        'components/feature_3/',
        'io',
        'components/feature/util',
        'components/feature_2/index',
        'ajax',
        'json',
        'components/feature_2/tool',
        'dd',
        'resizable',
        'xtemplate'
    ]
});